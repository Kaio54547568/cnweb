import { auth, signIn, signOut } from '@/auth';
import { backendFetch } from '@/lib/backend';
import { checkLoginRate } from '@/lib/login-rate';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface Episode {
  id: string;
  title: string;
  seriesTitle: string | null;
  channelName: string | null;
  visibility: 'SAMPLE' | 'MEMBER';
  episodeNumber: number | null;
}

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q, page, login, series, level, genre, channelId } = await searchParams;
  const query = typeof q === 'string' ? q.slice(0, 100).trim() : '';
  const pageNumber = typeof page === 'string' && /^[1-9]\d{0,2}$/.test(page) ? Number(page) : 1;
  const selectedSeries = typeof series === 'string' && series.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(series) ? series : '';
  const params = new URLSearchParams({ q: query, page: String(pageNumber) });
  if (selectedSeries) params.set('series', selectedSeries);
  const selectedLevel = typeof level === 'string' && /^N[1-5]$/.test(level) ? level : '';
  const selectedGenre = typeof genre === 'string' && genre.trim().length <= 80 && !/\0/.test(genre)
    ? genre.trim() : '';
  const selectedChannel = typeof channelId === 'string' && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(channelId)
    ? channelId.toLowerCase() : '';
  if (selectedLevel) params.set('level', selectedLevel);
  if (selectedGenre) params.set('genre', selectedGenre);
  if (selectedChannel) params.set('channelId', selectedChannel);
  const pageUrl = (number: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(number));
    return '/?' + next;
  };
  const session = await auth();
  const accountId = session?.accountId;
  const [catalog, me, seriesList, options] = await Promise.all([
    backendFetch('/episodes?' + params).catch(() => null),
    accountId ? backendFetch('/identity/me', { accountId }).catch(() => null) : null,
    backendFetch('/series').catch(() => null),
    backendFetch('/episodes/filters').catch(() => null),
  ]);
  const isMember = me?.ok === true;
  const isEditor = isMember && (await me.json() as { role: string }).role === 'EDITOR';
  const data = catalog?.ok ? await catalog.json() as { episodes: Episode[]; hasMore: boolean } : null;
  const groups = seriesList?.ok ? await seriesList.json() as { slug: string; title: string }[] : [];
  const filters = options?.ok ? await options.json() as {
    levels: string[]; genres: string[]; channels: { id: string; name: string }[];
  } : { levels: [], genres: [], channels: [] };
  const selectedGenreOption = filters.genres.find((item) => item.toLowerCase() === selectedGenre.toLowerCase())
    ?? selectedGenre;

  return (
    <main>
      <h1>Học tiếng Nhật qua video</h1>
      {session ? (
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <p>{isMember ? 'Đã đăng nhập' : 'Tài khoản hiện không truy cập được'}
            {accountId && <> · ID tài khoản <code>{accountId}</code></>}
          </p>
          <button>Đăng xuất</button>
        </form>
      ) : (
        <form action={async () => {
          'use server';
          const blocked = await checkLoginRate(await headers());
          if (blocked) redirect('/?login=' + (blocked.status === 429 ? 'limit' : 'unavailable'));
          await signIn('google', { redirectTo: '/' });
        }}>
          <button>Đăng nhập bằng Google</button>
        </form>
      )}
      {login === 'limit' && <p role="status">Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.</p>}
      {login === 'unavailable' && <p role="status">Đăng nhập tạm thời gián đoạn.</p>}
      {isMember && <p><a href="/learning">Sổ tay và Xem tiếp</a> · <a href="/account">Tài khoản</a></p>}
      {isEditor && <p><a href="/editorial">Mở trang biên tập</a></p>}
      <h2>Danh mục đã xuất bản</h2>
      <form action="/">
        <label>Series{' '}
          <select name="series" defaultValue={selectedSeries}>
            <option value="">Tất cả</option>
            {groups.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
          </select>
        </label>{' '}
        <label>Trình độ{' '}
          <select name="level" defaultValue={selectedLevel}>
            <option value="">Tất cả</option>
            {selectedLevel && !filters.levels.includes(selectedLevel) && <option>{selectedLevel}</option>}
            {filters.levels.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>{' '}
        <label>Thể loại{' '}
          <select name="genre" defaultValue={selectedGenreOption}>
            <option value="">Tất cả</option>
            {selectedGenreOption && !filters.genres.includes(selectedGenreOption) && <option>{selectedGenreOption}</option>}
            {filters.genres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>{' '}
        <label>Kênh{' '}
          <select name="channelId" defaultValue={selectedChannel}>
            <option value="">Tất cả</option>
            {selectedChannel && !filters.channels.some((item) => item.id === selectedChannel) &&
              <option value={selectedChannel}>Kênh đã chọn</option>}
            {filters.channels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>{' '}
        <label>Tìm theo tên tập, series hoặc kênh{' '}
          <input name="q" defaultValue={query} maxLength={100} />
        </label>{' '}
        <button>Tìm</button>
      </form>
      {!data ? <p>Chưa tải được danh mục.</p> : data.episodes.length ? (
        <ul>{data.episodes.map((item) => (
          <li key={item.id}>
            <strong>{item.episodeNumber ? 'Tập ' + item.episodeNumber + ' · ' : ''}{item.title}</strong>
            {[item.seriesTitle, item.channelName].filter(Boolean).map((label, index) => (
              <span key={index}> · {label}</span>
            ))}
            {' · '}
            {isMember || item.visibility === 'SAMPLE'
              ? <a href={'/api/v1/preview?episode=' + item.id}>Xem{item.visibility === 'SAMPLE' ? ' tập mẫu' : ''}</a>
              : <span>Cần đăng nhập để xem</span>}
          </li>
        ))}</ul>
      ) : <p>Không tìm thấy tập.</p>}
      {pageNumber > 1 && <a href={pageUrl(pageNumber - 1)}>Trang trước</a>}
      {' '}
      {data?.hasMore && pageNumber < 999 && <a href={pageUrl(pageNumber + 1)}>Trang sau</a>}
    </main>
  );
}
