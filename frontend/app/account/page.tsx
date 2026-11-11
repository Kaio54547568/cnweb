import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { backendFetch } from '@/lib/backend';
import { ProfileForm, type LearnerProfile } from './profile-form';

export const dynamic = 'force-dynamic';

export default async function Account({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session?.accountId) redirect('/');
  const response = await backendFetch('/identity/me', { accountId: session.accountId }).catch(() => null);
  if (response?.status === 401) redirect('/');
  const profile = response?.ok ? await response.json() as LearnerProfile : null;
  const { error } = await searchParams;
  return (
    <main>
      <p><a href="/">Về danh mục</a></p>
      <h1>Tài khoản</h1>
      {profile ? <ProfileForm profile={profile} googleName={session.user?.name} />
        : <p role="status">Chưa tải được hồ sơ. Vui lòng tải lại trang.</p>}
      <h2>Xóa tài khoản</h2>
      <p>Thao tác này xóa hồ sơ, sổ tay, tiến độ và liên kết đăng nhập của tài khoản hiện tại.</p>
      {error && <p role="status">Chưa xóa được tài khoản. Vui lòng thử lại.</p>}
      <form action={async (input) => {
        'use server';
        if (input.get('confirm') !== 'yes') return;
        const accountId = (await auth())?.accountId;
        if (!accountId) redirect('/');
        const result = await backendFetch('/identity/me', { method: 'DELETE', accountId }).catch(() => null);
        if (!result?.ok) redirect('/account?error=1');
        await signOut({ redirectTo: '/' });
      }}>
        <label><input name="confirm" type="checkbox" value="yes" required /> Tôi xác nhận xóa dữ liệu học.</label>{' '}
        <button>Xóa tài khoản</button>
      </form>
    </main>
  );
}
