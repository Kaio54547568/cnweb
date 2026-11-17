'use strict';

const status = document.getElementById('status');
const active = document.getElementById('active');
const params = new URLSearchParams(location.search);
const episodeId = params.get('episode');
const requestedTime = params.get('t');
const checkpointPath = '/api/v1/learning/checkpoints/' + encodeURIComponent(episodeId ?? '');
const resume = document.getElementById('resume');
const learningStatus = document.getElementById('learning-status');
const bookmarkLogin = document.getElementById('bookmark-login');
const dictionaryBookmarkStatus = document.getElementById('dictionary-bookmark-status');
const bookmarksPath = '/api/v1/learning/bookmarks';
const pendingBookmarks = new Map();
const term = document.getElementById('term');
const definitions = document.getElementById('definitions');
const playbackRate = document.getElementById('playback-rate');
const toggleTranslation = document.getElementById('toggle-translation');
const loopStatus = document.getElementById('loop-status');
let player;
let timer;
let ready = false;
let current = '';
let member = false;
let hasPlayed = false;
let lastSaved;
let pendingPosition;
let savingPosition = false;
let lastCheckpointAt = 0;
let lookupController;
let loop;
let seekDeadline;

function translationText(cue, separator) {
  const translation = document.createElement('span');
  translation.className = 'translation';
  translation.textContent = separator + cue.translation;
  return translation;
}

function stopLoop(message = '') {
  loop?.button.setAttribute('aria-pressed', 'false');
  loop = undefined;
  seekDeadline = undefined;
  loopStatus.textContent = message;
}

function rewindLoop() {
  seekDeadline = Date.now() + 3000;
  player.seekTo(loop.cue.startMs / 1000, true);
}

function tickLoop(timeMs, state) {
  if (!loop) return;
  const { startMs, endMs } = loop.cue;
  const inside = startMs <= timeMs && timeMs < endMs;
  if (seekDeadline !== undefined) {
    if (inside) seekDeadline = undefined;
    else if (state === YT.PlayerState.PLAYING && Date.now() >= seekDeadline) {
      stopLoop('Không tua được tới câu đang lặp.');
    }
    return;
  }
  if (state === YT.PlayerState.PLAYING && !inside) rewindLoop();
}

function syncPlaybackRates(rate = player.getPlaybackRate()) {
  const rates = player.getAvailablePlaybackRates();
  playbackRate.replaceChildren(...rates.map((value) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = value + '×';
    return option;
  }));
  playbackRate.value = String(rate);
  playbackRate.disabled = rates.length <= 1;
}

function rubyText(parts) {
  const fragment = document.createDocumentFragment();
  for (const [surface, reading] of parts) {
    if (!reading) {
      fragment.append(surface);
      continue;
    }
    const ruby = document.createElement('ruby');
    const rt = document.createElement('rt');
    rt.textContent = reading;
    ruby.append(surface, rt);
    fragment.append(ruby);
  }
  return fragment;
}

function sourceText(cue, interactive = false) {
  const fragment = document.createDocumentFragment();
  const words = cue.words ?? (cue.ruby ?? [[cue.text, null]]).map(([surface, reading]) => ({
    surface, lemma: reading ? surface : null, reading, ruby: [[surface, reading]],
  }));
  for (const word of words) {
    const content = rubyText(word.ruby);
    if (interactive && word.lemma) {
      const lookup = document.createElement('button');
      lookup.type = 'button';
      lookup.className = 'lookup-word';
      lookup.title = 'Tra từ';
      lookup.setAttribute('aria-label', 'Tra từ ' + word.surface);
      lookup.append(content);
      lookup.addEventListener('click', () => {
        term.value = word.surface;
        void lookupTerm(word.lemma, word.surface, word.reading);
      });
      fragment.append(lookup);
    } else {
      fragment.append(content);
    }
  }
  return fragment;
}

function showAt(cues, timeMs) {
  const visible = cues.filter((cue) => cue.startMs <= timeMs && timeMs < cue.endMs);
  const key = visible.map((cue) => cue.id).join(',');
  if (key === current) return;
  current = key;
  active.replaceChildren(...visible.map((cue) => {
    const line = document.createElement('div');
    if (cue.speaker) line.append(cue.speaker.name + ': ');
    line.append(sourceText(cue), translationText(cue, '\n'));
    return line;
  }));
}

function bookmarkButton(key, reference, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.textContent = '♡ ' + label;
  button.disabled = true;
  return { key, reference, label, button };
}

function showBookmarkLogin(items = []) {
  bookmarkLogin.hidden = false;
  for (const { button } of items) button.hidden = true;
}

function loadBookmarkGroup(query, items, notice, signal) {
  if (!items.length) return;
  let saved = new Set();
  let loaded = false;
  let refreshing = false;

  function render({ key, label, button }) {
    const marked = saved.has(key);
    button.disabled = !loaded || pendingBookmarks.has(key);
    if (!loaded) return;
    button.setAttribute('aria-pressed', String(marked));
    button.textContent = (marked ? '♥ ' : '♡ ') + label;
  }

  async function refresh(message = '') {
    if (refreshing) return;
    refreshing = true;
    loaded = false;
    items.forEach(render);
    notice.textContent = 'Đang tải trạng thái đã lưu…';
    try {
      // A previous lookup can be gone while its write is still in flight.
      await Promise.allSettled(items.map(({ key }) => pendingBookmarks.get(key)));
      if (signal?.aborted) return;
      const response = await fetch(bookmarksPath + '/status?' + query, { signal });
      if (signal?.aborted) return;
      if (response.status === 401) {
        showBookmarkLogin(items);
        notice.textContent = '';
        return;
      }
      if (!response.ok) throw new Error();
      const { keys } = await response.json();
      if (signal?.aborted) return;
      saved = new Set(keys);
      loaded = true;
      items.forEach(render);
      notice.textContent = message;
    } catch {
      if (signal?.aborted) return;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Thử lại';
      retry.addEventListener('click', () => void refresh(), { once: true });
      notice.replaceChildren('Không tải được trạng thái đã lưu. ', retry);
    } finally {
      refreshing = false;
    }
  }

  for (const item of items) {
    const { key, reference, button } = item;
    button.addEventListener('click', async () => {
      if (button.disabled || signal?.aborted) return;
      const removing = saved.has(key);
      const write = removing
        ? fetch(bookmarksPath + '/' + encodeURIComponent(key), { method: 'DELETE' })
        : fetch(bookmarksPath, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reference),
        });
      pendingBookmarks.set(key, write);
      button.disabled = true;
      try {
        const response = await write;
        if (signal?.aborted) return;
        if (response.status >= 500) throw new Error();
        if (response.status === 401) {
          showBookmarkLogin(items);
          notice.textContent = '';
        } else if (!response.ok) {
          notice.textContent = removing ? 'Không bỏ lưu được mục này.' : 'Không lưu được mục này.';
        } else {
          if (removing) saved.delete(key);
          else saved.add(key);
          notice.textContent = removing ? 'Đã bỏ lưu.' : 'Đã lưu vào sổ tay.';
        }
      } catch {
        // Read back the state because the server may have completed the write.
        if (!signal?.aborted) void refresh('Cập nhật bị gián đoạn. Đã tải lại trạng thái từ sổ tay.');
      } finally {
        pendingBookmarks.delete(key);
        if (!signal?.aborted) render(item);
      }
    });
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void refresh();
  }, { signal });
  void refresh();
}

async function lookupTerm(query = term.value.trim(), surface, reading) {
  if (!query) return;
  lookupController?.abort();
  const controller = new AbortController();
  lookupController = controller;
  definitions.replaceChildren();
  dictionaryBookmarkStatus.replaceChildren();
  try {
    const params = new URLSearchParams({ q: query });
    if (surface && surface !== query) params.set('surface', surface);
    const response = await fetch('/api/v1/dictionary?' + params,
      { signal: controller.signal });
    if (!response.ok) throw new Error(response.status === 429
      ? 'Đã chạm giới hạn tra từ. Vui lòng thử lại sau.' : 'Không tra được từ.');
    const { entries, kanji = [] } = await response.json();
    if (lookupController !== controller) return;
    if (!entries.length) {
      const item = document.createElement('li');
      item.textContent = reading ? 'Không có kết quả. Cách đọc: ' + reading : 'Không có kết quả.';
      definitions.append(item);
    }
    const entryIds = new Set(entries.map(({ id }) => id));
    const related = kanji.filter(({ id }) => !entryIds.has(id));
    const bookmarks = [];
    for (const entry of [...entries, ...related]) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = (entry.id.startsWith('kanji:') ? 'Kanji: ' : '') + entry.headword;
      const vietnamese = entry.glosses.filter(({ lang }) => lang === 'vi');
      const glosses = vietnamese.length ? vietnamese : entry.glosses;
      item.append(title, ' ' + entry.readings.join(' / '),
        ' — ' + glosses.slice(0, 5).map(({ lang, text, source }) =>
          (lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'Tiếng Anh' : lang) + ': ' + text +
          (source ? ' (' + source + ')' : '')).join(' · '));
      if (bookmarkLogin.hidden) {
        const bookmark = bookmarkButton('word:' + entry.id, { entryId: entry.id }, 'Lưu từ');
        bookmarks.push(bookmark);
        item.append(' ', bookmark.button);
      }
      definitions.append(item);
    }
    const bookmarkQuery = new URLSearchParams(bookmarks.map(({ reference }) => ['entryId', reference.entryId]));
    loadBookmarkGroup(bookmarkQuery, bookmarks, dictionaryBookmarkStatus, controller.signal);
  } catch (error) {
    if (lookupController !== controller || error.name === 'AbortError') return;
    const item = document.createElement('li');
    item.textContent = error.message;
    definitions.replaceChildren(item);
  }
}

async function checkpoint() {
  if (!member || !ready || !hasPlayed) return;
  const positionMs = Math.round(player.getCurrentTime() * 1000);
  if (!Number.isSafeInteger(positionMs) || positionMs < 0 || positionMs > 86400000) return;
  pendingPosition = positionMs;
  if (savingPosition) return;
  savingPosition = true;
  try {
    while (pendingPosition !== undefined) {
      const next = pendingPosition;
      pendingPosition = undefined;
      if (next === lastSaved) continue;
      const response = await fetch(checkpointPath, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionMs: next }),
      });
      if (!response.ok) break;
      lastSaved = next;
    }
  } catch {
    // A later checkpoint can be sent after the connection recovers.
  } finally {
    savingPosition = false;
  }
}

async function start() {
  if (!episodeId) {
    status.textContent = 'Thêm ?episode=<ID tập> vào địa chỉ để mở tập đã xuất bản.';
    return;
  }
  const response = await fetch('/api/v1/episodes/' + encodeURIComponent(episodeId));
  if (response.status === 401) {
    const link = document.createElement('a');
    link.href = '/';
    link.textContent = 'Đăng nhập từ danh mục';
    status.replaceChildren('Tập này yêu cầu tài khoản. ', link);
    return;
  }
  if (!response.ok) throw new Error('Không tải được tập đã xuất bản.');
  const episode = await response.json();
  const progress = await fetch(checkpointPath).catch(() => null);
  if (progress?.ok) {
    member = true;
    const { checkpoint: saved } = await progress.json();
    lastSaved = saved?.positionMs;
  } else if (progress?.status === 401) {
    showBookmarkLogin();
  }
  document.getElementById('title').textContent = episode.title;
  const list = document.getElementById('transcript');
  const bookmarks = [];
  for (const cue of episode.cues) {
    const item = document.createElement('li');
    const seek = document.createElement('button');
    seek.type = 'button';
    seek.dataset.seek = '';
    seek.disabled = true;
    seek.textContent = (cue.startMs / 1000).toFixed(2) + ' s';
    seek.addEventListener('click', () => {
      if (!ready) return;
      stopLoop();
      player.seekTo(cue.startMs / 1000, true);
    });
    const repeat = document.createElement('button');
    repeat.type = 'button';
    repeat.dataset.seek = '';
    repeat.disabled = true;
    repeat.textContent = 'Lặp câu';
    repeat.setAttribute('aria-pressed', 'false');
    repeat.addEventListener('click', () => {
      if (!ready) return;
      const alreadySelected = loop?.button === repeat;
      stopLoop();
      if (alreadySelected) return;
      loop = { cue, button: repeat };
      repeat.setAttribute('aria-pressed', 'true');
      loopStatus.textContent = 'Đang lặp câu từ giây ' + (cue.startMs / 1000).toFixed(2) + '.';
      rewindLoop();
      player.playVideo();
    });
    item.append(seek, repeat, sourceText(cue, true), translationText(cue, ' — '));
    if (cue.speaker) repeat.after(cue.speaker.name + ': ');
    if (bookmarkLogin.hidden) {
      const bookmark = bookmarkButton('cue:' + episodeId.toLowerCase() + ':' + cue.id,
        { episodeId, cueId: cue.id }, 'Lưu câu');
      bookmarks.push(bookmark);
      item.append(' ', bookmark.button);
    }
    list.append(item);
  }
  loadBookmarkGroup(new URLSearchParams({ episodeId }), bookmarks, learningStatus);

  toggleTranslation.disabled = false;
  status.textContent = 'Đang tải trình phát YouTube…';
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
      videoId: episode.youtubeId,
      playerVars: { origin: location.origin, playsinline: 1 },
      events: {
        onReady: () => {
          ready = true;
          syncPlaybackRates();
          status.textContent = 'Bấm phát để xem phụ đề đồng bộ.';
          list.querySelectorAll('button[data-seek]').forEach((button) => { button.disabled = false; });
          const explicit = requestedTime && /^\d{1,8}$/.test(requestedTime) && Number(requestedTime) <= 86400000;
          if (explicit) player.seekTo(Number(requestedTime) / 1000, true);
          else if (lastSaved > 0) {
            const resumeAt = lastSaved;
            resume.hidden = false;
            resume.addEventListener('click', () => {
              if (!ready) return;
              stopLoop();
              player.seekTo(resumeAt / 1000, true);
              resume.hidden = true;
            });
          }
          timer = setInterval(() => {
            const state = player.getPlayerState();
            const timeMs = player.getCurrentTime() * 1000;
            tickLoop(timeMs, state);
            showAt(episode.cues, timeMs);
            if (seekDeadline === undefined && state === YT.PlayerState.PLAYING && Date.now() - lastCheckpointAt >= 15000) {
              lastCheckpointAt = Date.now();
              void checkpoint();
            }
          }, 100);
        },
        onStateChange: ({ data }) => {
          if (data === YT.PlayerState.ENDED && ready && loop && seekDeadline === undefined) {
            rewindLoop();
            player.playVideo();
            return;
          }
          if (data === YT.PlayerState.PLAYING && !hasPlayed) {
            hasPlayed = true;
            lastCheckpointAt = Date.now();
          } else if (data === YT.PlayerState.PAUSED || data === YT.PlayerState.ENDED) {
            void checkpoint();
          }
        },
        onPlaybackRateChange: ({ data }) => {
          if (ready) syncPlaybackRates(data);
        },
        onError: () => {
          ready = false;
          stopLoop();
          playbackRate.disabled = true;
          resume.hidden = true;
          clearInterval(timer);
          list.querySelectorAll('button[data-seek]').forEach((button) => { button.disabled = true; });
          status.textContent = 'Không phát được video YouTube. Bạn vẫn có thể đọc transcript.';
        },
      },
    });
  };
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.onerror = () => { status.textContent = 'Không tải được trình phát YouTube.'; };
  document.head.append(script);
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) clearInterval(timer);
});
playbackRate.addEventListener('change', () => {
  if (!ready) return;
  const selected = Number(playbackRate.value);
  playbackRate.value = String(player.getPlaybackRate());
  player.setPlaybackRate(selected);
});
toggleTranslation.addEventListener('click', () => {
  const hidden = document.body.classList.toggle('hide-translation');
  toggleTranslation.setAttribute('aria-pressed', String(!hidden));
});
document.getElementById('dictionary').addEventListener('submit', (event) => {
  event.preventDefault();
  void lookupTerm();
});
start().catch((error) => { status.textContent = error.message; });
