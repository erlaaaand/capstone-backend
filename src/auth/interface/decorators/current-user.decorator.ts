// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Interface payload yang di-inject oleh JwtAuthGuard ke dalam request.
 * Field ini harus sesuai dengan payload yang dikemas saat JWT diterbitkan.
 */
export interface JwtUserPayload {
  sub: string;   // userId (UUID)
  email: string;
}

/**
 * @CurrentUser() — param decorator untuk mengekstrak data user
 * dari JWT payload yang sudah diverifikasi oleh JwtAuthGuard.
 *
 * Penggunaan di controller:
 *   @Get('me')
 *   getMe(@CurrentUser() user: JwtUserPayload) { ... }
 *
 * Atau ambil field spesifik:
 *   create(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtUserPayload }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
