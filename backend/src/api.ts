import 'reflect-metadata';
import {
  ConsoleLogger, Controller, Get, Headers, HttpCode, Logger, Module, NotFoundException,
  Post, Res, ServiceUnavailableException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExcludeEndpoint, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import { apiPort, validateConfig } from './config';
import { Database, DatabaseModule } from './database';
import { ApiErrors, RequestContext } from './http';
import { SmokeProducer } from './smoke';
import { EditorialModule } from './subtitles/editorial-http';
import { CatalogModule } from './catalog/catalog';
import { AccountClosureModule } from './identity/account-closure';
import { DictionaryModule } from './dictionary/dictionary';

@Controller('health')
class HealthController {
  constructor(private readonly database: Database) {}

  @Get('live')
  live(): { ok: true } {
    return { ok: true };
  }

  @Get('ready')
  async ready(): Promise<{ ok: true }> {
    try {
      await this.database.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}

@Controller('internal/smoke')
class SmokeController {
  constructor(private readonly producer: SmokeProducer) {}

  @Post()
  @HttpCode(202)
  @ApiExcludeEndpoint()
  async enqueue(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ jobId: string; requestId: string }> {
    const secret = process.env.SMOKE_TOKEN;
    const actual = Buffer.from(authorization ?? '');
    const expected = Buffer.from(`Bearer ${secret}`);
    if (!secret || secret.length < 32 || actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)) {
      throw new NotFoundException();
    }

    const requestId: string = response.locals.requestId;
    try {
      return { jobId: await this.producer.enqueue(requestId), requestId };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}

@Module({
  imports: [DatabaseModule, EditorialModule, CatalogModule, DictionaryModule, AccountClosureModule],
  controllers: [HealthController, SmokeController],
  providers: [SmokeProducer],
})
class ApiModule {}

async function main(): Promise<void> {
  validateConfig();
  const port = apiPort();
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    logger: new ConsoleLogger({ json: true }),
  });
  app.enableShutdownHooks();
  const context = new RequestContext();
  app.use(context.use.bind(context));
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalFilters(new ApiErrors());
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder().setTitle('CNWeb backend').setVersion('1').addBearerAuth().build();
  SwaggerModule.setup('api/v1/docs', app, () => SwaggerModule.createDocument(app, config), {
    ui: false,
    jsonDocumentUrl: 'api/v1/openapi.json',
  });
  await app.listen(port, '0.0.0.0');
}

void main().catch((error: Error) => {
  Logger.error({ service: 'api', operation: 'startup_failed', errorType: error.name,
    ...(error.message.startsWith('Invalid configuration:') ? { detail: error.message } : {}) });
  process.exit(1);
});
