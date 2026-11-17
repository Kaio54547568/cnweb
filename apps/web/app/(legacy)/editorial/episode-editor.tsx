'use client';

import { useState, type FormEvent } from 'react';

type Episode = { id: string; title: string; visibility: 'SAMPLE' | 'MEMBER';
  publishedId: string | null; seriesId: string | null; episodeNumber: number | null; channelId: string | null };
type EpisodePage = { episodes: Episode[]; page: number; hasMore: boolean };
type Channel = { id: string; name: string };
type Series = { id: string; title: string; slug: string; level: string | null; genre: string | null;
  channelId: string | null };
type Speaker = { id: string; name: string };
type Cue = { id: string; startMs: number; endMs: number; text: string; translation: string; speakerId?: string };
type CueEdit = Partial<Pick<Cue, 'translation' | 'speakerId'>>;
type Revision = { id: string; nlpStatus: string };
type Draft = Revision & { cues: Cue[] };
type Format = 'srt' | 'vtt' | 'json';
const base = '/api/v1/editorial';
const editableCue = ({ id, startMs, endMs, text, translation, speakerId }: Cue): Cue => ({
  id, startMs, endMs, text, translation: translation.trim(), speakerId,
});
const nlpLabels: Record<string, string> = {
  PENDING: 'Đang chờ xử lý', READY: 'Đã xử lý', FAILED: 'Xử lý thất bại', SUPERSEDED: 'Đã được thay thế',
};

class EditorialError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, message: string) {
    super(message);
  }
}

function ChannelSelect({ channels, value, disabled }: {
  channels: Channel[]; value?: string | null; disabled?: boolean;
}) {
  return <select name="channelId" defaultValue={value ?? ''} disabled={disabled}>
    <option value="">Không gán</option>
    {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
  </select>;
}

function SeriesFields({ channels, item }: { channels: Channel[]; item?: Series }) {
  return <>
    <label>Trình độ <select name="level" defaultValue={item?.level ?? ''}>
      <option value="">Chưa xác định</option>
      {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => <option key={level}>{level}</option>)}
    </select></label>{' '}
    <label>Thể loại <input name="genre" maxLength={80} defaultValue={item?.genre ?? ''} /></label>{' '}
    <label>Kênh <ChannelSelect channels={channels} value={item?.channelId} /></label>{' '}
  </>;
}

async function send<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
  const result = await fetch(base + path, {
    method,
    ...(payload === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }),
  });
  if (!result.ok) {
    const data = await result.json().catch(() => null);
    const requestId = result.headers.get('x-request-id');
    const message = data?.error?.message ?? 'Yêu cầu thất bại';
    throw new EditorialError(result.status, data?.error?.code,
      requestId ? `${message} (requestId ${requestId})` : message);
  }
  return result.status === 204 ? undefined as T : result.json();
}

async function readDraft(episodeId: string): Promise<Draft | null> {
  try {
    return await send<Draft>('/episodes/' + episodeId + '/draft');
  } catch (error) {
    if (error instanceof EditorialError && error.status === 404) return null;
    throw error;
  }
}

function CueTable({ cues, speakers, change }: {
  cues: Cue[]; speakers: Speaker[] | null; change: (id: string, edit: CueEdit) => void;
}) {
  const [missingIds, setMissingIds] = useState<Set<string> | null>(null);
  const [page, setPage] = useState(1);
  const rows = missingIds ? cues.filter((cue) => missingIds.has(cue.id)) : cues;
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;

  return <>
    <p><label><input type="checkbox" checked={missingIds !== null} onChange={(event) => {
      setMissingIds(event.target.checked ? new Set(cues.filter((cue) => !cue.translation.trim()).map(({ id }) => id)) : null);
      setPage(1);
    }} /> Chỉ hiện câu thiếu bản dịch</label></p>
    {rows.length === 0 ? <p>Không có câu thiếu bản dịch.</p> : <>
      <p>
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trang câu trước</button>{' '}
        Trang câu {currentPage}/{pageCount}{' '}
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Trang câu sau</button>
      </p>
      <table>
        <thead><tr><th>Thời gian (giây)</th><th>Câu gốc</th><th>Bản dịch tiếng Việt</th><th>Người nói</th></tr></thead>
        <tbody>{rows.slice(start, start + pageSize).map((cue) => <tr key={cue.id}>
          <td>{(cue.startMs / 1000).toFixed(3)}–{(cue.endMs / 1000).toFixed(3)}</td>
          <td style={{ whiteSpace: 'pre-wrap' }}>{cue.text}</td>
          <td><textarea aria-label={'Bản dịch: ' + cue.text} rows={2} maxLength={1000}
            value={cue.translation} onChange={(event) => change(cue.id, { translation: event.target.value })} /></td>
          <td><select aria-label={'Người nói: ' + cue.text} value={cue.speakerId ?? ''} disabled={!speakers}
            onChange={(event) => change(cue.id, { speakerId: event.target.value || undefined })}>
            <option value="">Không gán</option>
            {speakers?.map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}
          </select></td>
        </tr>)}</tbody>
      </table>
    </>}
  </>;
}

export function EpisodeEditor({ initialPage, initialSeries, initialChannels }: {
  initialPage: EpisodePage; initialSeries: Series[]; initialChannels: Channel[];
}) {
  const [episodePage, setEpisodePage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [series, setSeries] = useState(initialSeries);
  const [channels, setChannels] = useState(initialChannels);
  const [speakers, setSpeakers] = useState<Speaker[] | null>(null);
  const [current, setCurrent] = useState<Episode | null>(null);
  const [seriesToEdit, setSeriesToEdit] = useState('');
  const [newEpisodeSeries, setNewEpisodeSeries] = useState('');
  const [groupSeries, setGroupSeries] = useState('');
  const [draft, setDraft] = useState<Draft | null>();
  const [edits, setEdits] = useState<Record<string, CueEdit>>({});
  const [conflict, setConflict] = useState(false);
  const [format, setFormat] = useState<Format>('json');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const episodeId = current?.id ?? '';
  const path = '/episodes/' + episodeId;
  const items = current && !episodePage.episodes.some((item) => item.id === current.id)
    ? [current, ...episodePage.episodes] : episodePage.episodes;
  const editingSeries = series.find((item) => item.id === seriesToEdit);
  const dirty = Object.keys(edits).length > 0;
  const cues = draft?.cues.map((cue) => ({ ...cue, ...edits[cue.id] })) ?? [];
  const missing = cues.filter(({ translation }) => !translation.trim()).length;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      if (error instanceof EditorialError && error.code === 'REVISION_CONFLICT') {
        setConflict(true);
        setMessage('Bản nháp đã được thay đổi ở phiên khác. Phần đang sửa vẫn còn trên màn hình. Hãy đối chiếu trước khi tải bản nháp mới.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Yêu cầu thất bại');
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDiscard() {
    return !dirty || window.confirm('Bỏ thay đổi chưa lưu trong bản nháp đang mở?');
  }

  function updateEpisode(changes: Partial<Episode>) {
    setCurrent((item) => item && { ...item, ...changes });
    setEpisodePage((previous) => ({ ...previous, episodes: previous.episodes.map((item) =>
      item.id === episodeId ? { ...item, ...changes } : item) }));
  }

  async function openEpisode(episode: Episode | null) {
    setCurrent(episode);
    setGroupSeries(episode?.seriesId ?? '');
    setDraft(undefined);
    setEdits({});
    setConflict(false);
    setSpeakers(null);
    setFormat('json');
    if (!episode) return;
    const results = await Promise.allSettled([
      readDraft(episode.id).then(setDraft),
      send<Speaker[]>('/episodes/' + episode.id + '/speakers').then(setSpeakers),
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
  }

  async function findEpisodes(q: string, page: number) {
    const params = new URLSearchParams({ q, page: String(page) });
    setEpisodePage(await send<EpisodePage>('/episodes?' + params));
    setSearch(q);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmDiscard()) return;
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const payload = Object.fromEntries(form);
      const episode = await send<Episode>('/episodes', 'POST', {
        ...payload, episodeNumber: payload.episodeNumber ? Number(payload.episodeNumber) : null,
      });
      await openEpisode({ ...episode, publishedId: null });
      setMessage('Đã tạo tập. Bạn có thể nhập phụ đề.');
    });
  }

  async function reloadDraft() {
    const loaded = await readDraft(episodeId);
    setDraft(loaded);
    setEdits({});
    setConflict(false);
    setMessage(loaded ? 'Đã tải bản nháp.' : 'Tập chưa có bản nháp.');
  }

  async function refreshNlp() {
    if (!draft) return;
    const loaded = await readDraft(episodeId);
    if (loaded?.id !== draft.id) throw new EditorialError(409, 'REVISION_CONFLICT', 'Draft changed');
    setDraft({ ...draft, nlpStatus: loaded.nlpStatus });
    setMessage('Đã cập nhật trạng thái NLP.');
  }

  async function importSubtitles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft === undefined || conflict) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    const uploaded = file instanceof File && file.name ? file : null;
    const inputFormat = uploaded ? uploaded.name.split('.').at(-1)?.toLowerCase() : format;
    await run(async () => {
      if (inputFormat !== 'json' && inputFormat !== 'srt' && inputFormat !== 'vtt') {
        throw new Error('Chọn tệp SRT, VTT hoặc JSON.');
      }
      if (uploaded && uploaded.size > 1024 * 1024) throw new Error('Tệp lớn hơn 1 MB.');
      if (draft && !window.confirm('Thay toàn bộ bản nháp hiện tại?' + (inputFormat !== 'json'
        ? ' Nhập lại SRT/VTT tạo ID câu mới. Bookmark của các câu cũ có thể không còn mở được.'
        : ' Chỉ các câu giữ ID hợp lệ trong JSON mới giữ được liên kết bookmark.'))) return;
      const text = uploaded ? await uploaded.text() : String(data.get('content') ?? '');
      if (!text.trim()) throw new Error('Chọn tệp hoặc dán nội dung phụ đề trước khi nhập.');
      let content: unknown = text;
      if (inputFormat === 'json') {
        try { content = JSON.parse(text.replace(/^\uFEFF/, '')); }
        catch { throw new Error('Tệp hoặc nội dung JSON không hợp lệ.'); }
      }
      const revision = await send<Revision>(path + '/draft', 'PUT', {
        expectedDraftId: draft?.id ?? null, format: inputFormat, content,
      });
      form.reset();
      setDraft(undefined);
      setEdits({});
      try {
        const loaded = await readDraft(episodeId);
        if (loaded?.id !== revision.id) throw new EditorialError(409, 'REVISION_CONFLICT', 'Draft changed');
        setDraft(loaded);
      } catch (error) {
        throw new Error('Đã nhập phụ đề, nhưng chưa mở được bản vừa lưu. Hãy tải lại bản nháp.' +
          (error instanceof Error ? ' ' + error.message : ''));
      }
      setMessage('Đã nhập phụ đề vào bản nháp.');
    });
  }

  async function saveEdits() {
    if (!draft || !dirty || conflict) return;
    const clean = cues.map(editableCue);
    const revision = await send<Revision>(path + '/draft', 'PUT', {
      expectedDraftId: draft.id, format: 'json', content: { cues: clean },
    });
    setDraft({ ...revision, cues: clean });
    setEdits({});
    setMessage('Đã lưu bản nháp.');
  }

  function downloadDraft() {
    if (!draft) return;
    const json = JSON.stringify({ cues: draft.cues.map(editableCue) }, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phu-de-' + episodeId + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function changeCue(id: string, edit: CueEdit) {
    const original = draft?.cues.find((cue) => cue.id === id);
    if (!original) return;
    setEdits((previous) => {
      const updated = { ...previous };
      const cue = { ...original, ...previous[id], ...edit };
      if (cue.translation === original.translation && cue.speakerId === original.speakerId) delete updated[id];
      else updated[id] = { translation: cue.translation, speakerId: cue.speakerId };
      return updated;
    });
  }

  async function publish() {
    if (!draft || dirty || missing || conflict) return;
    const warning = draft.nlpStatus === 'READY' ? '' :
      ' NLP chưa sẵn sàng. Các câu thiếu furigana sẽ hiển thị chữ gốc.';
    if (!window.confirm('Xác nhận đã kiểm tra bản dịch của tất cả các câu và xuất bản bản nháp này?' + warning)) return;
    await run(async () => {
      const publication = await send<Revision>(path + '/publish', 'POST', { draftId: draft.id, reviewed: true });
      updateEpisode({ publishedId: publication.id });
      setDraft({ ...draft, nlpStatus: publication.nlpStatus });
      setMessage('Đã xuất bản.');
    });
  }

  async function addMetadata(event: FormEvent<HTMLFormElement>, kind: 'channels' | 'series' | 'speakers') {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    await run(async () => {
      if (kind === 'channels') {
        setChannels([...channels, await send<Channel>('/channels', 'POST', body)]);
      } else if (kind === 'series') {
        setSeries([...series, await send<Series>('/series', 'POST', body)]);
      } else {
        const speaker = await send<Speaker>(path + '/speakers', 'POST', body);
        setSpeakers((previous) => [...(previous ?? []), speaker]);
      }
      form.reset();
      setMessage('Đã lưu.');
    });
  }

  async function group(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const number = form.get('episodeNumber');
      const grouping = await send<Pick<Episode, 'seriesId' | 'episodeNumber' | 'channelId'>>(path + '/grouping', 'PUT', {
        seriesId: form.get('seriesId'), episodeNumber: number ? Number(number) : null,
        ...(form.has('channelId') && { channelId: form.get('channelId') }),
      });
      updateEpisode(grouping);
      setMessage('Đã cập nhật phân nhóm tập.');
    });
  }

  async function updateSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await run(async () => {
      const updated = await send<Series>('/series/' + seriesToEdit, 'PATCH', data);
      setSeries(series.map((item) => item.id === updated.id ? updated : item));
      setMessage('Đã cập nhật thông tin lọc của series.');
    });
  }

  return (
    <>
      <form onSubmit={(event) => void addMetadata(event, 'channels')}>
        <fieldset disabled={busy}>
          <legend>Tạo kênh</legend>
          <label>Tên kênh <input name="name" required maxLength={200} /></label>{' '}
          <button>Tạo kênh</button>
        </fieldset>
      </form>
      <form onSubmit={(event) => void addMetadata(event, 'series')}>
        <fieldset disabled={busy}>
          <legend>Tạo series</legend>
          <label>Tên <input name="title" required maxLength={200} /></label>{' '}
          <label>Slug <input name="slug" required maxLength={120} placeholder="vi-du-series" /></label>{' '}
          <SeriesFields channels={channels} />
          <button>Tạo series</button>
        </fieldset>
      </form>
      <form onSubmit={updateSeries}>
        <fieldset disabled={busy}>
          <legend>Cập nhật thông tin lọc của series</legend>
          <label>Series <select value={seriesToEdit} onChange={(event) => setSeriesToEdit(event.target.value)}>
            <option value="">Chọn series</option>
            {series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select></label>{' '}
          {editingSeries && <>
            <SeriesFields key={editingSeries.id} channels={channels} item={editingSeries} />
            <button>Lưu thông tin</button>
          </>}
        </fieldset>
      </form>
      <form onSubmit={create}>
        <fieldset disabled={busy}>
          <legend>Tạo tập</legend>
          <p><label>Tên tập <input name="title" required maxLength={200} /></label></p>
          <p><label>YouTube ID <input name="youtubeId" required pattern="[A-Za-z0-9_\-]{11}" /></label></p>
          <p><label>Series <select name="seriesId" value={newEpisodeSeries}
            onChange={(event) => setNewEpisodeSeries(event.target.value)}><option value="">Tập lẻ</option>
            {series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select></label>{' '}
            <label>Số tập <input name="episodeNumber" type="number" min={1} step={1} disabled={!newEpisodeSeries} /></label>{' '}
            <label>Kênh của tập lẻ <ChannelSelect channels={channels} disabled={!!newEpisodeSeries} /></label></p>
          <button>Tạo tập</button>
        </fieldset>
      </form>
      <fieldset disabled={busy}>
        <legend>Tìm và mở tập</legend>
        <form onSubmit={(event) => {
          event.preventDefault();
          const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
          void run(() => findEpisodes(q, 1));
        }}>
          <label>Tiêu đề tập <input name="q" type="search" maxLength={200} /></label>{' '}
          <button>Tìm tập</button>
        </form>
        <p>
          <button type="button" disabled={episodePage.page <= 1}
            onClick={() => void run(() => findEpisodes(search, episodePage.page - 1))}>Trang tập trước</button>{' '}
          Trang tập {episodePage.page}{' '}
          <button type="button" disabled={!episodePage.hasMore || episodePage.page >= 9999}
            onClick={() => void run(() => findEpisodes(search, episodePage.page + 1))}>Trang tập sau</button>
        </p>
        {episodePage.episodes.length === 0 && <p>Không có tập phù hợp với tìm kiếm.</p>}
        <label htmlFor="editorial-episode">Tập</label>{' '}
        <select id="editorial-episode" value={episodeId} onChange={(event) => {
          if (!confirmDiscard()) return;
          const episode = items.find((item) => item.id === event.target.value) ?? null;
          void run(() => openEpisode(episode));
        }}>
          <option value="">Chọn tập</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </fieldset>
      {current && (
        <fieldset key={episodeId} disabled={busy}>
          <legend>Biên tập {current.title}</legend>
          <form onSubmit={group}>
            <p>
              <label>Chuyển series <select name="seriesId" value={groupSeries}
                onChange={(event) => setGroupSeries(event.target.value)}>
                <option value="">Tập lẻ</option>
                {series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select></label>{' '}
              <label>Số tập <input name="episodeNumber" type="number" min={1} step={1}
                defaultValue={current.episodeNumber ?? undefined} disabled={!groupSeries} /></label>{' '}
              <label>Kênh của tập lẻ <ChannelSelect channels={channels} value={current.channelId}
                disabled={!!groupSeries} /></label>{' '}
              <button>Lưu phân nhóm</button>
            </p>
          </form>
          <form onSubmit={(event) => void addMetadata(event, 'speakers')}>
            <label>Tên người nói <input name="name" required maxLength={120} disabled={!speakers} /></label>{' '}
            <button disabled={!speakers}>Thêm người nói</button>{' '}
            {!speakers &&
              <button type="button" onClick={() => void run(async () => {
                setSpeakers(await send<Speaker[]>(path + '/speakers'));
              })}>Tải lại danh sách người nói</button>}
          </form>
          <p>
            <label>Quyền xem{' '}
              <select value={current.visibility} onChange={(event) => {
                const visibility = event.target.value as Episode['visibility'];
                void run(async () => {
                  await send(path + '/visibility', 'PUT', { visibility });
                  updateEpisode({ visibility });
                  setMessage('Đã cập nhật quyền xem.');
                });
              }}>
                <option value="MEMBER">Cần đăng nhập</option>
                <option value="SAMPLE">Tập mẫu công khai</option>
              </select>
            </label>
          </p>
          <h2>Nhập phụ đề</h2>
          <form onSubmit={importSubtitles}>
            <p><label>Tệp phụ đề <input name="file" type="file" accept=".json,.srt,.vtt" /></label></p>
            <details>
              <summary>Dán nội dung thay cho tệp</summary>
              <p><label>Định dạng nội dung <select value={format}
                onChange={(event) => setFormat(event.target.value as Format)}>
                <option value="json">JSON</option><option value="srt">SRT</option><option value="vtt">VTT</option>
              </select></label></p>
              <label>Nội dung phụ đề <textarea name="content" rows={5} /></label>
            </details>
            <p><button disabled={draft === undefined || conflict}>Nhập vào bản nháp</button></p>
          </form>
          <h2>Bản nháp và xuất bản</h2>
          <p>{current.publishedId ? 'Đã xuất bản.' : 'Chưa xuất bản.'}{' '}
            {current.publishedId && <a href={'/api/v1/preview?episode=' + episodeId}>Xem bản công khai</a>}
          </p>
          <p>
            <button type="button" onClick={() => { if (confirmDiscard()) void run(reloadDraft); }}>Tải lại bản nháp</button>{' '}
            <button type="button" disabled={!draft} onClick={downloadDraft}>Tải JSON bản đã lưu</button>{' '}
            <button type="button" disabled={!draft || conflict} onClick={() => void run(refreshNlp)}>Làm mới trạng thái NLP</button>{' '}
            <button type="button" disabled={!current.publishedId} onClick={() => {
              if (!window.confirm('Gỡ tập khỏi danh mục và dừng quyền xem?')) return;
              void run(async () => {
                await send(path + '/publication', 'DELETE');
                updateEpisode({ publishedId: null });
                setMessage('Đã gỡ xuất bản. Bản nháp vẫn còn.');
              });
            }}>Gỡ xuất bản</button>
          </p>
          {draft === undefined && <p>Chưa tải được bản nháp.</p>}
          {draft === null && <p>Tập chưa có bản nháp. Hãy nhập phụ đề.</p>}
          {draft && <>
            <p>NLP: {nlpLabels[draft.nlpStatus] ?? draft.nlpStatus} · {missing}/{cues.length} câu thiếu bản dịch.
              {dirty && ' Có thay đổi chưa lưu.'}{conflict && ' Bản nháp đã thay đổi ở phiên khác.'}
            </p>
            <p>
              <button type="button" disabled={!dirty || conflict} onClick={() => void run(saveEdits)}>Lưu bản nháp</button>{' '}
              <button type="button" disabled={dirty || missing > 0 || conflict || !cues.length}
                onClick={() => void publish()}>Duyệt và xuất bản</button>
            </p>
            <CueTable key={draft.id} cues={cues} speakers={speakers} change={changeCue} />
          </>}
        </fieldset>
      )}
      <p role="status">{busy ? 'Đang xử lý…' : message}</p>
    </>
  );
}
