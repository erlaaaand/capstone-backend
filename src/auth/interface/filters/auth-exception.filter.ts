// src/auth/interface/filters/auth-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface AuthErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error: string;
  module: 'auth';
}

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception.message;

    const body: AuthErrorResponseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message,
      error: exception.name,
      module: 'auth',
    };

    this.logger.warn(
      `[Auth] ${req.method} ${req.url} → ${status}: ${JSON.stringify(message)}`,
    );

    res.status(status).json(body);
  }
}
