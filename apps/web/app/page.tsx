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

  const field =
    'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted';
  const hasFilter = Boolean(selectedSeries || selectedLevel || selectedGenre || selectedChannel || query);
  const linkBtn =
    'inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm text-fg transition-colors hover:bg-elevated';
  const notice = 'rounded-lg border border-line bg-surface p-3 text-sm text-muted';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-fg">Kho nội dung</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {query ? `Kết quả cho “${query}”` : 'Video Nhật – Việt có phụ đề đồng bộ, furigana và tra từ'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {isMember && <a className={linkBtn} href="/learning">Sổ tay và Xem tiếp</a>}
          {isEditor && <a className={linkBtn} href="/editorial">Biên tập</a>}
          {session ? (
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
              <button className={linkBtn + ' cursor-pointer'}>Đăng xuất</button>
            </form>
          ) : (
            <form action={async () => {
              'use server';
              const blocked = await checkLoginRate(await headers());
              if (blocked) redirect('/?login=' + (blocked.status === 429 ? 'limit' : 'unavailable'));
              await signIn('google', { redirectTo: '/' });
            }}>
              <button className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
                Đăng nhập bằng Google
              </button>
            </form>
          )}
        </div>
      </header>

      {session && !isMember && <p role="status" className={notice}>Tài khoản hiện không truy cập được.</p>}
      {login === 'limit' && <p role="status" className={notice}>Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.</p>}
      {login === 'unavailable' && <p role="status" className={notice}>Đăng nhập tạm thời gián đoạn.</p>}

      <form action="/" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-muted">Series
          <select name="series" defaultValue={selectedSeries} className={field}>
            <option value="">Tất cả</option>
            {groups.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Trình độ
          <select name="level" defaultValue={selectedLevel} className={field}>
            <option value="">Tất cả</option>
            {selectedLevel && !filters.levels.includes(selectedLevel) && <option>{selectedLevel}</option>}
            {filters.levels.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Thể loại
          <select name="genre" defaultValue={selectedGenreOption} className={field}>
            <option value="">Tất cả</option>
            {selectedGenreOption && !filters.genres.includes(selectedGenreOption) && <option>{selectedGenreOption}</option>}
            {filters.genres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Kênh
          <select name="channelId" defaultValue={selectedChannel} className={field}>
            <option value="">Tất cả</option>
            {selectedChannel && !filters.channels.some((item) => item.id === selectedChannel) &&
              <option value={selectedChannel}>Kênh đã chọn</option>}
            {filters.channels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Tìm theo tên tập, series hoặc kênh
          <input name="q" defaultValue={query} maxLength={100} placeholder="Từ khóa…" className={field} />
        </label>
        <div className="flex gap-2 sm:col-span-2 xl:col-span-5">
          <button className="h-9 cursor-pointer rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
            Tìm
          </button>
          {hasFilter && <a className={linkBtn} href="/">Xóa bộ lọc</a>}
        </div>
      </form>

      {!data ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-muted">
          Chưa tải được danh mục.
        </p>
      ) : data.episodes.length ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.episodes.map((item) => {
            const canWatch = isMember || item.visibility === 'SAMPLE';
            return (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted">
                    {item.episodeNumber ? `Tập ${item.episodeNumber}` : 'Tập lẻ'}
                  </span>
                  {item.visibility === 'SAMPLE' && (
                    <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs text-brand">Xem thử</span>
                  )}
                </div>
                <h2 className="text-base font-semibold leading-snug text-fg">{item.title}</h2>
                <p className="text-sm text-muted">
                  {[item.seriesTitle, item.channelName].filter(Boolean).join(' · ') || 'Chưa có series'}
                </p>
                <div className="mt-auto pt-1">
                  {canWatch ? (
                    <a
                      href={'/api/v1/preview?episode=' + item.id}
                      className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                    >
                      Xem{item.visibility === 'SAMPLE' ? ' tập mẫu' : ''}
                    </a>
                  ) : (
                    <span className="text-sm text-muted">Cần đăng nhập để xem</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="font-semibold text-fg">Không tìm thấy tập</p>
          <p className="mt-1 text-sm text-muted">Thử đổi bộ lọc hoặc dùng từ khóa ngắn hơn.</p>
        </div>
      )}

      <nav aria-label="Phân trang" className="flex gap-2">
        {pageNumber > 1 && <a className={linkBtn} href={pageUrl(pageNumber - 1)}>Trang trước</a>}
        {data?.hasMore && pageNumber < 999 && <a className={linkBtn} href={pageUrl(pageNumber + 1)}>Trang sau</a>}
      </nav>
    </div>
  );
}
