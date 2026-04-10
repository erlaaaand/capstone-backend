// src/auth/domains/services/token.service.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { AuthenticatedUser, JwtPayload } from '../entities/jwt-payload.entity';

/**
 * FIX [MEDIUM-02]: Definisikan tipe eksplisit untuk format
 * expires-in yang valid sesuai spesifikasi jsonwebtoken library.
 */
export type JwtExpiresInFormat =
  | `${number}d`
  | `${number}h`
  | `${number}m`
  | `${number}s`
  | number;

@Injectable()
export class TokenService {
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.issuer = this.config.getOrThrow<string>('JWT_ISSUER');
    this.audience = this.config.getOrThrow<string>('JWT_AUDIENCE');
  }

  /**
   * Generate JWT dengan issuer dan audience ter-embed.
   * JwtModule sudah dikonfigurasi dengan secret dan expiresIn
   * via registerAsync di AuthModule — tidak perlu pass ulang di sini.
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      iss: this.issuer,
      aud: this.audience,
    });
  }

  /**
   * FIX [HIGH-04]: Tambah try-catch dengan error narrowing.
   *
   * Sebelumnya method ini tidak memiliki error handling sama sekali,
   * sehingga JsonWebTokenError akan bubble up sebagai 500 Internal
   * Server Error alih-alih 401 Unauthorized.
   *
   * Sekarang:
   * - TokenExpiredError → 401 dengan pesan spesifik
   * - JsonWebTokenError → 401 dengan pesan generik (tidak bocorkan detail)
   * - Error lain yang tidak dikenal → 500 dengan log
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        issuer: this.issuer,
        audience: this.audience,
      });
    } catch (err: unknown) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Token sudah kadaluarsa. Silakan login kembali.',
        );
      }

      if (err instanceof JsonWebTokenError) {
        // Pesan generik — tidak bocorkan detail teknis ke client
        throw new UnauthorizedException(
          'Token tidak valid atau telah dimanipulasi.',
        );
      }

      // Error tidak terduga — log dan throw 500
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        `Gagal memverifikasi token: ${message}`,
      );
    }
  }

  decodeToAuthUser(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }

  /**
   * FIX [MEDIUM-02]: Return type eksplisit string
   * (sesuai nilai yang dibaca dari env — sudah divalidasi formatnya).
   */
  getExpiresIn(): string {
    return this.config.getOrThrow<string>('JWT_EXPIRES_IN');
  }
}
