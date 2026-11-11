import { isIP } from 'node:net';
import { backendFetch } from './backend';

export function clientKey(headers: Pick<Headers, 'get'>): string {
  const address = process.env.VERCEL === '1' ? headers.get('x-vercel-forwarded-for') : null;
  return address && isIP(address) ? address : 'local';
}

export async function checkLoginRate(headers: Pick<Headers, 'get'>) {
  const response = await backendFetch('/identity/login-limit', {
    method: 'POST', loginRateKey: clientKey(headers),
  }).catch(() => null);
  if (response?.ok) return null;
  if (response?.status === 429) {
    return { status: 429, message: 'Bạn đã thử đăng nhập quá nhiều lần.',
      retryAfter: response.headers.get('retry-after') };
  }
  return { status: 503, message: 'Đăng nhập tạm thời gián đoạn. Vui lòng thử lại.' };
}
