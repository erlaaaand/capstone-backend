import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction): void {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks);

      if (
        req.headers['content-type']?.includes('application/json') &&
        req.rawBody.length > 0
      ) {
        try {
          (req as Request).body = JSON.parse(req.rawBody.toString('utf-8'));
        } catch {
          // body sudah di-parse oleh middleware sebelumnya
        }
      }

      next();
    });

    req.on('error', () => {
      next();
    });
  }
}