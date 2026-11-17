import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger, NestMiddleware,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export class ApiProblem extends HttpException {
  constructor(status: number, readonly code: string, message: string, readonly retryAfter?: number) {
    super(message, status);
  }
}

export class RequestContext implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    const started = Date.now();
    res.setHeader('X-Request-Id', requestId);
    res.locals.requestId = requestId;
    res.once('finish', () => logger.log({
      service: 'api', operation: 'request', requestId, method: req.method,
      route: req.route?.path, status: res.statusCode, durationMs: Date.now() - started,
    }));
    next();
  }
}

const errors: Record<number, [string, string]> = {
  400: ['INVALID_REQUEST', 'Invalid request'],
  401: ['UNAUTHENTICATED', 'Authentication required'],
  403: ['FORBIDDEN', 'Access denied'],
  404: ['NOT_FOUND', 'Resource not found'],
  413: ['PAYLOAD_TOO_LARGE', 'Payload too large'],
  503: ['UNAVAILABLE', 'Service temporarily unavailable'],
};

@Catch()
export class ApiErrors implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const requestId = res.locals.requestId;
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const [code, message] = exception instanceof ApiProblem ? [exception.code, exception.message]
      : errors[status] ?? (status >= 500
      ? ['INTERNAL_ERROR', 'Internal server error']
      : ['REQUEST_FAILED', 'Request failed']);
    if (exception instanceof ApiProblem && exception.retryAfter !== undefined) {
      res.setHeader('Retry-After', exception.retryAfter);
    }
    if (status >= 500) {
      logger.error({ service: 'api', operation: 'request_error', requestId, code,
        errorType: exception instanceof Error ? exception.name : undefined });
    }
    res.status(status).json({ error: { code, message }, requestId });
  }
}
