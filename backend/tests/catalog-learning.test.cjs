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

  } catch (error) {
    error.message += '\n' + output.join('');
    throw error;
  } finally {
    api.kill();
    await db.$disconnect();
  }
});
