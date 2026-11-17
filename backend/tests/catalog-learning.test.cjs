const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createHmac, randomBytes, randomUUID } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const test = require('node:test');
const { PrismaClient } = require('@prisma/client');

const key = randomBytes(32).toString('hex');
const port = process.env.CATALOG_TEST_PORT ?? '3302';
const base = 'http://127.0.0.1:' + port + '/api/v1';

function bearer(sub) {
  const iat = Math.floor(Date.now() / 1000);
  const encoded = Buffer.from(JSON.stringify({
    iss: 'cnweb-web', aud: 'cnweb-api', purpose: 'session', sub, iat, exp: iat + 30,
  })).toString('base64url');
  const signature = createHmac('sha256', Buffer.from(key, 'hex')).update(encoded).digest('base64url');
  return 'Bearer ' + encoded + '.' + signature;
}

async function seedEpisode(db, data, withSubtitles = true) {
  const episode = await db.episode.create({ data: { youtubeId: randomBytes(8).toString('base64url').slice(0, 11), ...data } });
  if (!withSubtitles) return episode;
  const revision = await db.subtitleRevision.create({
    data: { episodeId: episode.id, requestId: randomUUID(), nlpStatus: 'READY' },
  });
  const cueId = randomUUID();
  await db.subtitleCue.create({ data: { episodeId: episode.id, id: cueId } });
  await db.subtitleLine.create({ data: {
    revisionId: revision.id, episodeId: episode.id, cueId, ordinal: 0, startMs: 0, endMs: 1000,
    text: 'こんにちは', translationVi: 'Xin chào',
  } });
  return db.episode.update({ where: { id: episode.id }, data: { publishedId: revision.id, draftId: revision.id } });
}

test('catalog and learning expose card metadata', async () => {
  assert.ok(process.env.DATABASE_URL && process.env.REDIS_URL, 'Use a test PostgreSQL and Redis');
  const db = new PrismaClient();
  const tag = randomBytes(4).toString('hex');
  const output = [];
  const api = spawn(process.execPath, ['dist/api.js'], {
    env: { ...process.env, PORT: port, BACKEND_ASSERTION_KEY: key },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [api.stdout, api.stderr]) stream.on('data', (chunk) => output.push(chunk.toString()));
  const request = (path, options = {}) => fetch(base + path, { ...options, signal: AbortSignal.timeout(3000) });

  try {
    const channel = await db.channel.create({ data: { name: 'Channel ' + tag } });
    const series = await db.series.create({ data: {
      slug: 'series-' + tag, title: 'Series ' + tag, description: 'Mô tả ' + tag, level: 'N4', channelId: channel.id,
    } });
    const second = await seedEpisode(db, { title: 'B ' + tag, seriesId: series.id, episodeNumber: 2, visibility: 'SAMPLE' });
    const first = await seedEpisode(db, {
      title: 'A ' + tag, seriesId: series.id, episodeNumber: 1, durationMs: 90_000,
    });
    await seedEpisode(db, { title: 'Hidden ' + tag, seriesId: series.id, episodeNumber: 3 }, false);
    const account = await db.account.create({ data: {} });
    for (const [episode, positionMs] of [[first, 30_000], [second, 5_000]]) {
      await db.checkpoint.create({ data: { accountId: account.id, episodeId: episode.id, positionMs } });
    }

    for (let attempt = 0; attempt < 60; attempt += 1) {
      if ((await request('/health/live').catch(() => null))?.ok) break;
      await delay(200);
    }

    // Series list: counts only published episodes, thumbnail from episode number 1.
    const list = await (await request('/series')).json();
    const found = list.find((item) => item.slug === series.slug);
    assert.equal(found.description, 'Mô tả ' + tag);
    assert.equal(found.episodeCount, 2);
    assert.equal(found.thumbnailUrl, `https://i.ytimg.com/vi/${first.youtubeId}/hqdefault.jpg`);

    // Episode search carries the card fields.
    const search = await (await request('/episodes?series=' + series.slug)).json();
    assert.deepEqual(search.episodes.map((item) => item.title), ['A ' + tag, 'B ' + tag]);
    assert.equal(search.episodes[0].durationMs, 90_000);
    assert.equal(search.episodes[0].level, 'N4');
    assert.equal(search.episodes[0].channelName, 'Channel ' + tag);
    assert.equal(search.episodes[0].thumbnailUrl, `https://i.ytimg.com/vi/${first.youtubeId}/hqdefault.jpg`);

    // Episode detail carries series metadata next to the cues.
    const detail = await (await request('/episodes/' + second.id, { headers: { Authorization: bearer(account.id) } })).json();
    assert.equal(detail.seriesSlug, series.slug);
    assert.equal(detail.seriesTitle, series.title);
    assert.equal(detail.episodeNumber, 2);
    assert.equal(detail.visibility, 'SAMPLE');
    assert.equal(detail.level, 'N4');
    assert.equal(detail.cues.length, 1);

    // Checkpoints: default latest list, then an explicit ID list.
    const headers = { Authorization: bearer(account.id) };
    const latest = await (await request('/learning/checkpoints', { headers })).json();
    assert.equal(latest.items.length, 2);
    const requested = await (await request(
      '/learning/checkpoints?episodeId=' + first.id + '&episodeId=' + first.id, { headers: { Authorization: bearer(account.id) } },
    )).json();
    assert.equal(requested.items.length, 1);
    assert.equal(requested.items[0].episodeId, first.id);
    assert.equal(requested.items[0].positionMs, 30_000);
    assert.equal(requested.items[0].durationMs, 90_000);
    assert.equal(requested.items[0].episodeNumber, 1);
    assert.equal(requested.items[0].seriesTitle, series.title);
    assert.equal(requested.items[0].title, 'A ' + tag);

    // CMS can set and clear the duration through grouping.
    const editor = await db.account.create({ data: { role: 'EDITOR' } });
    const standalone = await seedEpisode(db, { title: 'Solo ' + tag, channelId: channel.id }, false);
    const put = (body) => request('/editorial/episodes/' + standalone.id + '/grouping', {
      method: 'PUT', body: JSON.stringify(body),
      headers: { Authorization: bearer(editor.id), 'Content-Type': 'application/json' },
    });
    assert.equal((await (await put({ durationMs: 123_000 })).json()).durationMs, 123_000);
    assert.equal((await (await put({})).json()).durationMs, 123_000);
    assert.equal((await (await put({ durationMs: null })).json()).durationMs, null);
    assert.equal((await put({ durationMs: -5 })).status, 400);

    const tooMany = Array.from({ length: 33 }, () => 'episodeId=' + randomUUID()).join('&');
    assert.equal((await request('/learning/checkpoints?' + tooMany, { headers: { Authorization: bearer(account.id) } })).status, 400);
    assert.equal((await request('/learning/checkpoints?episodeId=nope', { headers: { Authorization: bearer(account.id) } })).status, 400);

    // Bookmarks: ruby on cues, word source, summary.
    const ruby = [['今日', 'きょう'], ['は', null]];
    const rubyEpisode = await seedEpisode(db, { title: 'Ruby ' + tag });
    await db.subtitleLine.updateMany({ where: { episodeId: rubyEpisode.id }, data: { tokens: ruby } });
    const rubyCue = (await db.subtitleLine.findFirst({ where: { episodeId: rubyEpisode.id } })).cueId;
    const entryId = 'jmdict:' + (9_000_000 + Math.floor(Math.random() * 99_999));
    await db.dictionaryEntry.create({ data: { id: entryId, headword: '今日', readings: ['きょう'], glosses: [] } });
    const json = { Authorization: bearer(account.id), 'Content-Type': 'application/json' };
    const post = (body) => request('/learning/bookmarks', {
      method: 'POST', body: JSON.stringify(body), headers: { ...json, Authorization: bearer(account.id) },
    });
    assert.equal((await post({ episodeId: rubyEpisode.id, cueId: rubyCue })).status, 200);
    assert.equal((await post({ entryId, sourceEpisodeId: rubyEpisode.id })).status, 400);
    assert.equal((await post({ entryId, sourceEpisodeId: rubyEpisode.id, sourceCueId: randomUUID() })).status, 404);
    assert.equal((await post({ entryId, sourceEpisodeId: rubyEpisode.id, sourceCueId: rubyCue })).status, 200);
    assert.equal((await post({ episodeId: rubyEpisode.id, cueId: rubyCue, sourceCueId: rubyCue })).status, 400);

    const read = () => request('/learning/bookmarks', { headers: { Authorization: bearer(account.id) } }).then((r) => r.json());
    let items = (await read()).items;
    const cueItem = items.find((item) => item.kind === 'cue');
    assert.deepEqual(cueItem.cue.ruby, ruby);
    assert.equal(cueItem.cue.id, rubyCue);
    const wordItem = items.find((item) => item.kind === 'word');
    assert.deepEqual(wordItem.source, { episodeId: rubyEpisode.id, episodeTitle: 'Ruby ' + tag, cueId: rubyCue, startMs: 0 });
    const summary = await (await request('/learning/bookmarks/summary', { headers: { Authorization: bearer(account.id) } })).json();
    assert.deepEqual(summary, { words: 1, cues: 1 });

    // Unpublishing hides the source but keeps the word bookmark.
    await db.episode.update({ where: { id: rubyEpisode.id }, data: { publishedId: null } });
    items = (await read()).items;
    assert.equal(items.find((item) => item.kind === 'word').source, null);
    assert.equal(items.find((item) => item.kind === 'cue').available, false);


    // Dictionary entries carry parts of speech and an optional JLPT level.
    const posId = 'jmdict:' + (8_000_000 + Math.floor(Math.random() * 99_999));
    await db.dictionaryEntry.create({ data: { id: posId, headword: '勉強' + tag, readings: ['べんきょう'],
      glosses: [], partsOfSpeech: ['noun (common) (futsuumeishi)'] } });
    await db.dictionaryTerm.create({ data: { term: '勉強' + tag, entryId: posId } });
    const looked = await (await request('/dictionary?q=' + encodeURIComponent('勉強' + tag))).json();
    assert.deepEqual(looked.entries[0].partsOfSpeech, ['noun (common) (futsuumeishi)']);
    assert.equal(looked.entries[0].jlptLevel, null);
    await post({ entryId: posId });
    const wordsAfter = (await read()).items.filter((item) => item.kind === 'word');
    assert.deepEqual(wordsAfter.find((item) => item.entry.id === posId).entry.partsOfSpeech,
      ['noun (common) (futsuumeishi)']);


    // Standalone episodes carry their own level and genre; series episodes inherit.
    const genreName = 'Genre' + tag;
    const labelled = await seedEpisode(db, { title: 'Labelled ' + tag });
    const label = (episodeId, body) => request('/editorial/episodes/' + episodeId + '/grouping', {
      method: 'PUT', body: JSON.stringify(body),
      headers: { Authorization: bearer(editor.id), 'Content-Type': 'application/json' },
    });
    const labelled200 = await (await label(labelled.id, { level: 'N3', genre: genreName })).json();
    assert.equal(labelled200.level, 'N3');
    assert.equal(labelled200.genre, genreName);
    assert.equal((await label(labelled.id, { level: 'N9' })).status, 400);
    assert.equal((await label(labelled.id, { seriesId: series.id, level: 'N3' })).status, 400);

    const byLevel = await (await request('/episodes?level=N3&q=' + tag)).json();
    assert.deepEqual(byLevel.episodes.map((item) => item.title), ['Labelled ' + tag]);
    assert.equal(byLevel.episodes[0].level, 'N3');
    assert.equal(byLevel.episodes[0].genre, genreName);
    const byGenre = await (await request('/episodes?genre=' + genreName.toLowerCase())).json();
    assert.deepEqual(byGenre.episodes.map((item) => item.title), ['Labelled ' + tag]);
    const byQuery = await (await request('/episodes?q=' + genreName)).json();
    assert.deepEqual(byQuery.episodes.map((item) => item.title), ['Labelled ' + tag]);
    const filters = await (await request('/episodes/filters')).json();
    assert.ok(filters.levels.includes('N3'));
    assert.ok(filters.genres.includes(genreName));
    // Series level filter still finds series episodes.
    const seriesLevel = await (await request('/episodes?level=N4&series=' + series.slug)).json();
    assert.equal(seriesLevel.episodes.length, 2);

    // Joining a series clears the standalone labels.
    const joined = await (await label(labelled.id, { seriesId: series.id, episodeNumber: 9 })).json();
    assert.equal(joined.level, null);
    assert.equal(joined.genre, null);

    // Creating an episode accepts level and genre for standalone episodes only.
    const create = (body) => request('/editorial/episodes', {
      method: 'POST', body: JSON.stringify({ youtubeId: 'abcdefghijk', title: 'Created ' + tag, ...body }),
      headers: { Authorization: bearer(editor.id), 'Content-Type': 'application/json' },
    });
    const created = await create({ level: 'N2', genre: genreName, durationMs: 60_000 });
    assert.equal(created.status, 201);
    const createdBody = await created.json();
    assert.equal(createdBody.level, 'N2');
    assert.equal(createdBody.genre, genreName);
    assert.equal(createdBody.durationMs, 60_000);
    assert.equal((await create({ level: 'N0' })).status, 400);
    assert.equal((await create({ seriesId: series.id, genre: genreName })).status, 400);
    const inherited = await (await create({ seriesId: series.id, episodeNumber: 20 })).json();
    assert.equal(inherited.level, null);
    assert.equal(inherited.genre, null);

    // Series detail lists readable episodes in order; unknown or empty series are 404.
    const seriesPage = await (await request('/series/' + series.slug)).json();
    assert.equal(seriesPage.title, series.title);
    assert.equal(seriesPage.episodeCount, 3);
    assert.deepEqual(seriesPage.episodes.map((item) => item.episodeNumber), [1, 2, 9]);
    assert.equal(seriesPage.episodes[0].thumbnailUrl, seriesPage.thumbnailUrl);
    assert.equal((await request('/series/missing-' + tag)).status, 404);
    assert.equal((await request('/series/Bad_Slug')).status, 404);
    const emptySeries = await db.series.create({ data: { slug: 'empty-' + tag, title: 'Empty ' + tag } });
    assert.equal((await request('/series/' + emptySeries.slug)).status, 404);

  } catch (error) {
    error.message += '\n' + output.join('');
    throw error;
  } finally {
    api.kill();
    await db.$disconnect();
  }
});
