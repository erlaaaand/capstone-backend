// src/auth/infrastructures/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../domains/entities/jwt-payload.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    /**
     * FIX [HIGH-03]: Tambah issuer dan audience validation.
     *
     * Dengan ini, token yang dibuat oleh service lain (meski
     * menggunakan secret yang sama) akan ditolak karena
     * claim iss dan aud tidak cocok.
     *
     * Ini mencegah token confusion attack di arsitektur multi-service.
     */
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      audience: config.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  /**
   * validate() dipanggil oleh Passport setelah JWT berhasil diverifikasi.
   * Payload dijamin sudah valid di titik ini — iss, aud, exp sudah dicek.
   *
   * FIX [BUG-CURRENT-USER]: Return object sekarang menggunakan field 'sub'
   * (bukan 'userId') agar konsisten dengan:
   *   - AuthenticatedUser class yang sudah di-update
   *   - @CurrentUser('sub') decorator yang digunakan di semua controller
   *   - JwtUserPayload interface di current-user.decorator.ts
   *
   * SEBELUM:
   *   return { userId: payload.sub, email: payload.email }
   *   → @CurrentUser('sub') mengembalikan undefined karena field 'sub'
   *     tidak ada di object ini. Semua controller mendapat userId = undefined.
   *
   * SESUDAH:
   *   return { sub: payload.sub, email: payload.email }
   *   → @CurrentUser('sub') mengembalikan UUID user yang benar.
   *     UserController, PredictionController, StorageController semua
   *     mendapat authenticatedUserId yang valid.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || payload.sub.trim().length === 0) {
      throw new UnauthorizedException(
        'Token tidak valid: subject claim kosong.',
      );
    }

    if (!payload.email || payload.email.trim().length === 0) {
      throw new UnauthorizedException('Token tidak valid: email claim kosong.');
    }

    return {
      sub: payload.sub,       // ← FIX: 'sub' bukan 'userId'
      email: payload.email,
    };
  }
}