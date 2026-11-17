import { handlers } from '@/auth';
import { checkLoginRate } from '@/lib/login-rate';
import type { NextRequest } from 'next/server';

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (/\/signin(?:\/google)?\/?$/.test(request.nextUrl.pathname)) {
    const failure = await checkLoginRate(request.headers);
    if (failure) return new Response(failure.message, {
      status: failure.status,
      headers: failure.retryAfter ? { 'Retry-After': failure.retryAfter } : undefined,
    });
  }
  return handlers.POST(request);
}
