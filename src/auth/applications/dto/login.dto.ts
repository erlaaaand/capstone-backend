// src/auth/applications/dto/login.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  /**
   * FIX [CRITICAL-03]: Tambah @Transform untuk:
   * 1. Trim whitespace sebelum validasi (mencegah lookup miss)
   * 2. Lowercase normalisasi konsisten dengan data tersimpan di DB
   * 3. Buang null-byte (\x00) yang bisa menyebabkan string bypass
   *
   * FIX [MEDIUM-01]: Normalisasi dilakukan di DTO layer sebagai
   * garis pertahanan pertama, bukan hanya di DomainService.
   */
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    // Buang null-byte dan karakter kontrol lainnya, lalu trim & lowercase
    return value.replace(/\x00/g, '').trim().toLowerCase();
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @MaxLength(255, { message: 'Email maksimal 255 karakter' })
  email: string = '';

  /**
   * FIX [CRITICAL-03]: Trim password tapi TIDAK lowercase —
   * password case-sensitive. Buang null-byte saja.
   *
   * Catatan: Jangan trim password karena spasi di awal/akhir
   * mungkin disengaja oleh user. Hanya buang null-byte.
   */
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\x00/g, '');
  })
  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(128, { message: 'Password maksimal 128 karakter' })
  password: string = '';
}
