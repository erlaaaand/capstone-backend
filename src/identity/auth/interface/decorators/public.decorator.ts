// src/auth/interface/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator untuk menandai route yang tidak memerlukan autentikasi JWT.
 *
 * @example
 * \@Public()
 * \@Post('login')
 * login() { ... }
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
