import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/backend';

type Gloss = { lang: string; text: string; source?: string };
function preferredGlosses(glosses: Gloss[]) {
  const vietnamese = glosses.filter(({ lang }) => lang === 'vi');
  return (vietnamese.length ? vietnamese : glosses).slice(0, 5);
}
type Item =
  | { key: string; kind: 'word'; available: true; entry: {
      headword: string; readings: string[]; glosses: Gloss[];
    } }
  | { key: string; kind: 'cue'; available: false }
  | { key: string; kind: 'cue'; available: true; episodeId: string; episodeTitle: string;
      cue: { text: string; translation: string; startMs: number } };

export const dynamic = 'force-dynamic';

export default async function Library({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const accountId = (await auth())?.accountId;
  if (!accountId) redirect('/');
  const requested = (await searchParams).page;
  const page = requested && /^[1-9]\d{0,3}$/.test(requested) ? Number(requested) : 1;
  const [bookmarks, checkpoints] = await Promise.all([
    backendFetch('/learning/bookmarks?page=' + page, { accountId }).catch(() => null),
    backendFetch('/learning/checkpoints', { accountId }).catch(() => null),
  ]);
  const saved = bookmarks?.ok ? await bookmarks.json() as { items: Item[]; hasMore: boolean } : null;
  const recent = checkpoints?.ok ? await checkpoints.json() as { items: {
    episodeId: string; title: string; positionMs: number;
  }[] } : null;

  return (
    <main>
      <p><a href="/">Về danh mục</a></p>
      <h1>Sổ tay</h1>
      {!saved ? <p>Chưa tải được sổ tay.</p> : !saved.items.length ? <p>Chưa có mục đã lưu.</p> : (
        <ul>{saved.items.map((item) => <li key={item.key} style={{ marginBottom: '1rem' }}>
          {!item.available ? <span>Câu này hiện không còn mở được.</span> : item.kind === 'word' ? (
            <>
              <strong>{item.entry.headword}</strong> {item.entry.readings.join(' / ')}
              <p>{preferredGlosses(item.entry.glosses).map(({ lang, text, source }) =>
                (lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'Tiếng Anh' : lang) + ': ' + text +
                (source ? ' (' + source + ')' : '')).join(' · ')}</p>
              <small><a href="https://www.edrdg.org/edrdg/licence.html">Nguồn EDRDG</a></small>
            </>
          ) : (
            <>
              <a href={'/api/v1/preview?' + new URLSearchParams({
                episode: item.episodeId, t: String(item.cue.startMs),
              })}>{item.episodeTitle}</a>
              <p>{item.cue.text} · {item.cue.translation}</p>
            </>
          )}
          <form action={async () => {
            'use server';
            const actor = (await auth())?.accountId;
            if (!actor) redirect('/');
            const removed = await backendFetch('/learning/bookmarks/' + encodeURIComponent(item.key), {
              accountId: actor, method: 'DELETE',
            }).catch(() => null);
            if (!removed?.ok) throw new Error('Không xóa được mục đã lưu');
            revalidatePath('/learning');
          }}>
            <button>Xóa khỏi sổ tay</button>
          </form>
        </li>)}</ul>
      )}
      {page > 1 && <a href={'/learning?page=' + (page - 1)}>Trang trước</a>}
      {' '}
      {saved?.hasMore && page < 9999 && <a href={'/learning?page=' + (page + 1)}>Trang sau</a>}
      <h2>Xem tiếp</h2>
      {!recent ? <p>Chưa tải được tiến độ.</p> : !recent.items.length ? <p>Chưa có tiến độ xem.</p> : (
        <ul>{recent.items.map((item) => <li key={item.episodeId}>
          <a href={'/api/v1/preview?' + new URLSearchParams({
            episode: item.episodeId, t: String(item.positionMs),
          })}>{item.title} · {Math.floor(item.positionMs / 1000)} giây</a>
        </li>)}</ul>
      )}
    </main>
  );
}
