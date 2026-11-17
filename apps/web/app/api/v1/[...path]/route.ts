import { auth } from '@/auth';
import { backendFetch } from '@/lib/backend';
import { clientKey } from '@/lib/login-rate';

const uuid = '[a-f\\d]{8}-(?:[a-f\\d]{4}-){3}[a-f\\d]{12}';
const episode = new RegExp('^/episodes/' + uuid + '$', 'i');
const seriesMetadata = new RegExp('^/editorial/series/' + uuid + '$', 'i');
const editorial = new RegExp('^/editorial/episodes/' + uuid + '/(draft|publish|visibility|publication|grouping|speakers)$', 'i');
const checkpoint = new RegExp('^/learning/checkpoints/' + uuid + '$', 'i');
const bookmark = new RegExp('^/learning/bookmarks/(?:cue:' + uuid + ':' + uuid
  + '|word:(?:jmdict:\\d{1,12}|kanji:[a-f\\d]{4,6}))$', 'i');
const bodyLimit = 1024 * 1024;

function allowed(path: string, method: string): boolean {
  if (seriesMetadata.test(path)) return method === 'PATCH';
  if (path === '/identity/me') return method === 'GET' || method === 'PATCH' || method === 'DELETE';
  if (path === '/learning/bookmarks') return method === 'GET' || method === 'POST';
  if (path === '/learning/bookmarks/status') return method === 'GET';
  if (path === '/learning/checkpoints') return method === 'GET';
  if (checkpoint.test(path)) return method === 'GET' || method === 'PUT';
  if (bookmark.test(path)) return method === 'DELETE';
  if (['/editorial/episodes', '/editorial/channels', '/editorial/series'].includes(path)) {
    return method === 'GET' || method === 'POST';
  }
  const action = editorial.exec(path)?.[1];
  if (action === 'draft') return method === 'GET' || method === 'PUT';
  if (action === 'publish') return method === 'POST';
  if (action === 'visibility') return method === 'PUT';
  if (action === 'publication') return method === 'DELETE';
  if (action === 'grouping') return method === 'PUT';
  if (action === 'speakers') return method === 'GET' || method === 'POST';
  return method === 'GET' && (
    ['/episodes', '/episodes/filters', '/series', '/dictionary', '/preview', '/preview/player.js'].includes(path) || episode.test(path)
  );
}

function problem(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, {
    status, headers: { 'Cache-Control': 'private, no-store' },
  });
}

async function readBody(request: Request): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > bodyLimit) {
      await reader.cancel();
      return;
    }
    parts.push(result.value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.byteLength;
  }
  return body;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const pathname = '/' + path.join('/');
  const method = request.method;
  if (!allowed(pathname, method)) return problem(404, 'NOT_FOUND', 'Resource not found');
  const write = method !== 'GET';
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (write) {
    if (!process.env.AUTH_URL || request.headers.get('origin') !== new URL(process.env.AUTH_URL).origin) {
      return problem(403, 'FORBIDDEN_ORIGIN', 'Request must come from the application origin');
    }
    if (method !== 'DELETE') {
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return problem(415, 'JSON_REQUIRED', 'Use application/json');
      }
      body = await readBody(request);
      if (!body) return problem(413, 'PAYLOAD_TOO_LARGE', 'Payload too large');
    }
  }
  const publicRoute = ['/episodes', '/episodes/filters', '/series', '/preview', '/preview/player.js'].includes(pathname);
  const accountId = publicRoute ? undefined : (await auth())?.accountId;
  if (!accountId && (pathname.startsWith('/editorial/') || pathname.startsWith('/learning/') ||
      pathname === '/identity/me')) {
    return problem(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  // Forward query strings only on routes that accept them.
  const query = method === 'GET' &&
    ['/episodes', '/dictionary', '/learning/bookmarks', '/learning/bookmarks/status', '/editorial/episodes'].includes(pathname)
    ? new URL(request.url).search : '';
  try {
    const guestKey = pathname === '/dictionary' && !accountId ? clientKey(request.headers) : undefined;
    const upstream = await backendFetch(pathname + query, { method, body, accountId, guestKey });
    const headers = new Headers({ 'Cache-Control': 'private, no-store' });
    for (const name of ['content-type', 'content-security-policy', 'x-request-id', 'retry-after']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return problem(502, 'BACKEND_UNAVAILABLE', 'Backend unavailable');
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
