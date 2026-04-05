// src/storage/interface/guards/file-size.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard tambahan sebagai defense-in-depth untuk validasi ukuran file.
 * Berjalan sebelum controller — melengkapi validasi di FileValidator domain.
 */
@Injectable()
export class FileSizeGuard implements CanActivate {
  private readonly MAX_BYTES = 10 * 1024 * 1024; // 5MB

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const contentLength = request.headers['content-length'];

    if (contentLength && parseInt(contentLength, 10) > this.MAX_BYTES) {
      throw new PayloadTooLargeException(
        'Ukuran request melebihi batas maksimum 5MB',
      );
    }

    return true;
  }
}
