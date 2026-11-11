import { BeforeApplicationShutdown, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { redisConnection } from './config';
import { Database } from './database';

const queueName = 'platform-smoke';
const jobName = 'check';

interface SmokeJob {
  version: 1;
  requestId: string;
}

@Injectable()
export class SmokeProducer implements OnApplicationShutdown {
  private readonly logger = new Logger(SmokeProducer.name);
  private queue?: Queue<SmokeJob>;

  async enqueue(requestId: string): Promise<string> {
    if (!this.queue) {
      const queue = new Queue<SmokeJob>(queueName, {
        connection: {
          ...redisConnection(), maxRetriesPerRequest: 0,
          connectTimeout: 3000, commandTimeout: 3000,
        },
      });
      queue.on('error', (error) => this.logger.error({
        service: 'api', operation: 'queue_connection', errorType: error.name,
      }));
      this.queue = queue;
    }

    const jobId = randomUUID();
    await this.queue.add(jobName, { version: 1, requestId }, {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 100 },
    });
    this.logger.log({ service: 'api', operation: 'smoke_enqueued', requestId, jobId });
    return jobId;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue?.close();
  }
}

@Injectable()
export class SmokeConsumer implements BeforeApplicationShutdown {
  private readonly logger = new Logger(SmokeConsumer.name);
  private worker?: Worker<SmokeJob>;

  async start(): Promise<void> {
    const worker = new Worker<SmokeJob>(queueName, async (job) => {
      const { requestId, version } = job.data;
      if (!job.id || job.name !== jobName || version !== 1 || typeof requestId !== 'string') {
        throw new Error('Unsupported smoke job');
      }
      await this.database.smokeResult.upsert({
        where: { jobId: job.id },
        create: { jobId: job.id, requestId },
        update: {},
      });
    }, { connection: { ...redisConnection(), maxRetriesPerRequest: null } });
    this.worker = worker;
    worker.on('completed', (job) => this.logger.log({
      service: 'worker', operation: 'smoke_completed', requestId: job.data.requestId, jobId: job.id,
    }));
    worker.on('failed', (job, error) => this.logger.error({
      service: 'worker', operation: 'smoke_failed', requestId: job?.data.requestId, jobId: job?.id,
      errorType: error.name,
    }));
    worker.on('error', (error) => this.logger.error({
      service: 'worker', operation: 'queue_connection', errorType: error.name,
    }));
    await worker.waitUntilReady();
    this.logger.log({ service: 'worker', operation: 'ready', queue: queueName });
  }

  constructor(private readonly database: Database) {}

  async beforeApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
