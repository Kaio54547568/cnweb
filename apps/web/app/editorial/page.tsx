import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/backend';
import { EpisodeEditor } from './episode-editor';

export const dynamic = 'force-dynamic';

export default async function EditorialPage() {
  const accountId = (await auth())?.accountId;
  if (!accountId) redirect('/');
  const me = await backendFetch('/identity/me', { accountId }).catch(() => null);
  if (!me?.ok || (await me.json() as { role: string }).role !== 'EDITOR') {
    return <div className="flex flex-col gap-4"><h1>Biên tập</h1><p>Trang này cần vai trò biên tập viên.</p><a href="/">Về danh mục</a></div>;
  }
  const [list, series, channels] = await Promise.all(
    ['/editorial/episodes?page=1', '/editorial/series', '/editorial/channels']
      .map((path) => backendFetch(path, { accountId }).catch(() => null)),
  );
  return (
    <div className="flex flex-col gap-4">
      <p><a href="/">Về danh mục</a></p>
      <h1>Biên tập tập và phụ đề</h1>
      {list?.ok && series?.ok && channels?.ok
        ? <EpisodeEditor initialPage={await list.json()} initialSeries={await series.json()}
          initialChannels={await channels.json()} />
        : <p>Chưa tải được danh mục biên tập.</p>}
    </div>
  );
}
