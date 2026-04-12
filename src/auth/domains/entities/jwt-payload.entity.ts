// src/auth/domains/entities/jwt-payload.entity.ts

/**
 * Representasi payload yang di-encode ke dalam JWT token.
 *
 * FIX [HIGH-03]: Tambah field issuer (iss) dan audience (aud)
 * untuk mencegah token confusion attack di sistem multi-service.
 * Token yang dibuat oleh service lain dengan secret yang sama
 * tidak akan diterima karena iss/aud tidak cocok.
 */
export class JwtPayload {
  /** User ID — subject claim standar JWT (RFC 7519) */
  sub: string = '';
  email: string = '';

  /**
   * Issuer: identitas service yang menerbitkan token.
   * Harus cocok dengan JWT_ISSUER di environment.
   */
  iss?: string;

  /**
   * Audience: identitas penerima token yang dituju.
   * Harus cocok dengan JWT_AUDIENCE di environment.
   */
  aud?: string | string[];

  /** Issued at — diisi otomatis oleh JwtService */
  iat?: number;

  /** Expiry — diisi otomatis oleh JwtService */
  exp?: number;
}

/**
 * Hasil decode setelah JWT diverifikasi oleh strategy.
 * Digunakan sebagai tipe di CurrentUser decorator.
 *
 * FIX [BUG-CURRENT-USER]: Field 'userId' diganti menjadi 'sub'
 * agar konsisten dengan:
 *   1. @CurrentUser('sub') yang digunakan di SEMUA controller
 *      (UserController, PredictionController, StorageController)
 *   2. JwtUserPayload interface di current-user.decorator.ts
 *      yang mendefinisikan field 'sub'
 *
 * SEBELUM: { userId: string, email: string }
 *   → @CurrentUser('sub') mengembalikan undefined karena field
 *     tidak ada, sehingga semua ownership check gagal dan
 *     data disimpan dengan userId = undefined
 *
 * SESUDAH: { sub: string, email: string }
 *   → @CurrentUser('sub') mengembalikan UUID user yang benar
 */
export class AuthenticatedUser {
  /** UUID user — sama dengan claim 'sub' di JWT */
  sub: string = '';
  email: string = '';
}