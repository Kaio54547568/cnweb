import 'dotenv/config';
import type { RedisOptions } from 'bullmq';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Invalid configuration: ${name} is required`);
  return value;
}

function parseUrl(name: string, protocols: string[]): URL {
  try {
    const url = new URL(required(name));
    if (url.hostname && protocols.includes(url.protocol)) return url;
  } catch {
    // Avoid including connection credentials in the error.
  }
  throw new Error(`Invalid configuration: ${name}`);
}

export function redisConnection(): RedisOptions {
  const url = parseUrl('REDIS_URL', ['redis:', 'rediss:']);
  const database = url.pathname.slice(1) || '0';
  if (!/^\d+$/.test(database) || !Number.isSafeInteger(Number(database))) {
    throw new Error('Invalid configuration: REDIS_URL database');
  }

  return {
    host: url.hostname.replace(/^\[|\]$/g, ''),
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number(database),
    tls: url.protocol === 'rediss:' ? { servername: url.hostname } : undefined,
  };
}

export function validateConfig(): void {
  parseUrl('DATABASE_URL', ['postgres:', 'postgresql:']);
  redisConnection();
}

export function apiPort(): number {
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid configuration: PORT');
  }
  return port;
}
