import 'reflect-metadata';
import { ConsoleLogger, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { validateConfig } from './config';
import { DatabaseModule } from './database';
import { SmokeConsumer } from './smoke';
import { EditorialWorker, EditorialWorkerModule } from './subtitles/editorial-worker';

@Module({ imports: [DatabaseModule, EditorialWorkerModule], providers: [SmokeConsumer] })
class WorkerModule {}

async function main(): Promise<void> {
  validateConfig();
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: new ConsoleLogger({ json: true }),
  });
  app.enableShutdownHooks();
  app.get(EditorialWorker).start();
  await app.get(SmokeConsumer).start();
}

void main().catch((error: Error) => {
  Logger.error({ service: 'worker', operation: 'startup_failed', errorType: error.name,
    ...(error.message.startsWith('Invalid configuration:') ? { detail: error.message } : {}) });
  process.exit(1);
});
