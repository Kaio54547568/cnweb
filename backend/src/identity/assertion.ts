import { UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

type Purpose = 'session' | 'google-login' | 'login-rate' | 'guest';

export function verifyAssertion(authorization: string | undefined, purpose: Purpose): string {
  const denied = () => new UnauthorizedException();
  const key = process.env.BACKEND_ASSERTION_KEY;
  if (!key || !/^[a-f\d]{64}$/i.test(key) || !authorization || authorization.length > 1500) {
    throw denied();
  }
  const match = /^Bearer ([A-Za-z\d_-]+)\.([A-Za-z\d_-]{43})$/.exec(authorization);
  if (!match) throw denied();
  const [, encoded, signature] = match;
  const expected = createHmac('sha256', Buffer.from(key, 'hex')).update(encoded).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw denied();

  let claims;
  try {
    claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw denied();
  }
  const now = Math.floor(Date.now() / 1000);
  if (claims?.iss !== 'cnweb-web' || claims.aud !== 'cnweb-api' || claims.purpose !== purpose ||
      !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) ||
      claims.iat > now + 5 || claims.exp <= now || claims.exp <= claims.iat ||
      claims.exp - claims.iat > 30 || typeof claims.sub !== 'string') {
    throw denied();
  }
  return claims.sub;
}
