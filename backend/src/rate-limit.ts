import { Injectable, Logger, Module, OnApplicationShutdown, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import Redis from 'ioredis';
import { redisConnection } from './config';
import { ApiProblem } from './http';

const countWindow = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "return {count, redis.call('TTL', KEYS[1])}",
].join('\n');

@Injectable()
export class RateLimit implements OnApplicationShutdown {
  private readonly logger = new Logger(RateLimit.name);
  private readonly redis = new Redis({
    ...redisConnection(), connectTimeout: 2000, commandTimeout: 1500,
    maxRetriesPerRequest: 0, enableOfflineQueue: false, lazyConnect: true,
  });
  private ready?: Promise<void>;
  private lastWarning = 0;

  constructor() {
    this.redis.on('error', () => this.unavailable());
  }

  private unavailable(): void {
    if (Date.now() - this.lastWarning < 30_000) return;
    this.lastWarning = Date.now();
    this.logger.warn({ service: 'api', operation: 'rate_limit_redis_unavailable' });
  }

  async check(bucket: string, subject: string, maximum: number, seconds: number, allowOnError: boolean) {
    const secret = process.env.BACKEND_ASSERTION_KEY ?? '';
    const id = createHmac('sha256', secret).update(subject).digest('hex');
    let count: number;
    let ttl: number;
    try {
      if (this.redis.status === 'wait') this.ready = this.redis.connect();
      if (this.ready) {
        const connecting = this.ready;
        try { await connecting; } finally { this.ready = undefined; }
      }
      [count, ttl] = await this.redis.eval(countWindow, 1, 'cnweb:rate:' + bucket + ':' + id, seconds) as [number, number];
    } catch {
      this.unavailable();
      if (!allowOnError) throw new ServiceUnavailableException();
      return;
    }
    if (count > maximum) {
      throw new ApiProblem(429, 'RATE_LIMITED', 'Too many requests', Math.max(1, ttl));
    }
  }

  onApplicationShutdown(): void {
    this.redis.disconnect();
  }
}

@Module({ providers: [RateLimit], exports: [RateLimit] })
export class RateLimitModule {}
