// src/auth/domains/entities/jwt-payload.entity.ts

/**
 * Representasi payload yang di-encode ke dalam JWT token.
 * Bukan TypeORM entity — ini adalah pure domain value object.
 */
export class JwtPayload {
  sub: string = ''; // userId
  email: string = '';
  iat?: number; // issued at (diisi otomatis oleh JwtService)
  exp?: number; // expiry  (diisi otomatis oleh JwtService)
}

/**
 * Hasil decode setelah JWT diverifikasi oleh strategy.
 * Digunakan sebagai tipe di CurrentUser decorator.
 */
export class AuthenticatedUser {
  userId: string = '';
  email: string = '';
}
