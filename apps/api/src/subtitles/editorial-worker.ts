import { BeforeApplicationShutdown, Injectable, Logger, Module } from '@nestjs/common';
import { NlpStatus } from '@prisma/client';
import { Job, Queue, Worker } from 'bullmq';
import { redisConnection } from '../config';
import { Database, DatabaseModule } from '../database';
import { Furigana } from './furigana';

const queueName = 'subtitle-enrichment';
const jobName = 'furigana';

interface SubtitleJob {
  version: 1;
  revisionId: string;
  requestId: string;
}

@Injectable()
export class EditorialWorker implements BeforeApplicationShutdown {
  private readonly logger = new Logger(EditorialWorker.name);
  private queue?: Queue<SubtitleJob>;
  private worker?: Worker<SubtitleJob>;
  private timer?: NodeJS.Timeout;
  private dispatch?: Promise<void>;
  private closing = false;

  constructor(private readonly db: Database, private readonly furigana: Furigana) {}

  start(): void {
    const connection = redisConnection();
    this.queue = new Queue<SubtitleJob>(queueName, {
      connection: { ...connection, maxRetriesPerRequest: 0, commandTimeout: 3000 },
    });
    this.worker = new Worker<SubtitleJob>(queueName, (job) => this.process(job), {
      connection: { ...connection, maxRetriesPerRequest: null },
      concurrency: 1,
    });
    const logConnection = (error: Error) => this.logger.error({
      service: 'worker', operation: 'subtitle_queue_connection', errorType: error.name,
    });
    this.queue.on('error', logConnection);
    this.worker.on('error', logConnection);
    this.worker.on('failed', (job, error) => this.logger.warn({
      service: 'worker', operation: 'furigana_attempt_failed', revisionId: job?.data.revisionId,
      jobId: job?.id, requestId: job?.data.requestId, attempt: job?.attemptsMade, errorType: error.name,
    }));
    this.tick(this.queue);
  }

  private tick(queue: Queue<SubtitleJob>): void {
    this.dispatch = this.dispatchPending(queue).catch((error: Error) => {
      this.logger.warn({ service: 'worker', operation: 'subtitle_dispatch_failed', errorType: error.name });
    }).finally(() => {
      if (!this.closing) this.timer = setTimeout(() => this.tick(queue), 2000);
    });
  }

  private async dispatchPending(queue: Queue<SubtitleJob>): Promise<void> {
    const pending = await this.db.subtitleRevision.findMany({
      where: { nlpStatus: NlpStatus.PENDING, sourceDraftId: null,
        nextDispatchAt: { lte: new Date() }, draftFor: { isNot: null } },
      orderBy: [{ nextDispatchAt: 'asc' }, { id: 'asc' }],
      take: 10,
      select: { id: true, requestId: true },
    });
    for (const revision of pending) {
      if (this.closing) break;
      const job = await queue.getJob(revision.id);
      if (!job) {
        await queue.add(jobName, { version: 1, revisionId: revision.id, requestId: revision.requestId }, {
          jobId: revision.id, attempts: 3, backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 3600, count: 200 },
        });
      }
      // Redis coordinates delivery. PostgreSQL stores both the pending request and the outcome.
      const status = job && await job.isFailed() ? NlpStatus.FAILED : NlpStatus.PENDING;
      const updated = await this.db.subtitleRevision.updateMany({
        where: { id: revision.id, nlpStatus: NlpStatus.PENDING },
        data: { nlpStatus: status, nextDispatchAt: new Date(Date.now() + 5000) },
      });
      if (status === NlpStatus.FAILED && updated.count && job) await job.remove();
    }
  }

  private async process(job: Job<SubtitleJob>): Promise<void> {
    const { revisionId, version } = job.data;
    if (job.name !== jobName || version !== 1 || job.id !== revisionId) {
      throw new Error('Unsupported subtitle job');
    }
    const draft = await this.db.subtitleRevision.findFirst({
      where: { id: revisionId, nlpStatus: NlpStatus.PENDING, sourceDraftId: null,
        draftFor: { isNot: null } },
      select: { requestId: true, episodeId: true,
        lines: { orderBy: { ordinal: 'asc' }, select: { cueId: true, text: true } } },
    });
    if (!draft) return;
    if (!draft.lines.length) throw new Error('Draft has no subtitle lines');
    const words = await this.furigana.read(draft.lines.map((line) => line.text));
    const enriched = JSON.stringify(draft.lines.map((line, index) => ({
      cue_id: line.cueId, tokens: { words: words[index] },
    })));
    const updated = await this.db.$transaction(async (tx) => {
      const result = await tx.subtitleRevision.updateMany({
        where: { id: revisionId, nlpStatus: NlpStatus.PENDING, draftFor: { isNot: null } },
        data: { nlpStatus: NlpStatus.READY },
      });
      if (!result.count) return false;
      const count = await tx.$executeRaw`UPDATE subtitle_lines l SET tokens = result.tokens
        FROM jsonb_to_recordset(${enriched}::jsonb) AS result(cue_id uuid, tokens jsonb)
        WHERE l.revision_id = ${revisionId}::uuid AND l.cue_id = result.cue_id`;
      if (count !== draft.lines.length) throw new Error('Incomplete subtitle enrichment');
      return true;
    });
    if (updated) this.logger.log({
      service: 'worker', operation: 'furigana_ready', revisionId, episodeId: draft.episodeId,
      jobId: job.id, requestId: draft.requestId,
    });
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.closing = true;
    clearTimeout(this.timer);
    await this.dispatch;
    await this.worker?.close();
    this.furigana.close();
    await this.queue?.close();
  }
}

@Module({ imports: [DatabaseModule], providers: [Furigana, EditorialWorker], exports: [EditorialWorker] })
export class EditorialWorkerModule {}
