import { createHmac } from 'node:crypto';

function signedAuthorization(purpose: 'session' | 'google-login' | 'login-rate' | 'guest', sub: string): string {
  const key = process.env.BACKEND_ASSERTION_KEY;
  if (!key || !/^[a-f\d]{64}$/i.test(key)) throw new Error('Invalid backend assertion key');
  const iat = Math.floor(Date.now() / 1000);
  const claims = { iss: 'cnweb-web', aud: 'cnweb-api', purpose, sub, iat, exp: iat + 30 };
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', Buffer.from(key, 'hex')).update(encoded).digest('base64url');
  return 'Bearer ' + encoded + '.' + signature;
}

export async function backendFetch(
  path: string,
  options: { method?: string; body?: Uint8Array<ArrayBuffer>; accountId?: string;
    googleSubject?: string; loginRateKey?: string; guestKey?: string } = {},
): Promise<Response> {
  const url = new URL('/api/v1' + path, process.env.BACKEND_URL);
  const headers = new Headers();
  if (options.body) headers.set('Content-Type', 'application/json');
  if (options.googleSubject) {
    headers.set('Authorization', signedAuthorization('google-login', options.googleSubject));
  } else if (options.loginRateKey) {
    headers.set('Authorization', signedAuthorization('login-rate', options.loginRateKey));
  } else if (options.accountId) {
    headers.set('Authorization', signedAuthorization('session', options.accountId));
  } else if (options.guestKey) {
    headers.set('X-Cnweb-Guest', signedAuthorization('guest', options.guestKey));
  }
  return fetch(url, {
    method: options.method ?? 'GET', headers, body: options.body,
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
  });
}
