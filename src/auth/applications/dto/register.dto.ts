// src/auth/applications/dto/register.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  /**
   * FIX [CRITICAL-03] + [MEDIUM-01]:
   * Normalisasi email di DTO layer — trim, lowercase, buang null-byte.
   */
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\x00/g, '').trim().toLowerCase();
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @MaxLength(255, { message: 'Email maksimal 255 karakter' })
  email: string = '';

  /**
   * FIX [CRITICAL-03]: Buang null-byte pada password.
   * Tidak di-trim — spasi pada password mungkin disengaja.
   */
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\x00/g, '');
  })
  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(128, { message: 'Password maksimal 128 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password harus mengandung minimal satu huruf besar, ' +
      'satu huruf kecil, dan satu angka',
  })
  password: string = '';

  /**
   * FIX [CRITICAL-03]: Sanitasi fullName — trim dan buang
   * karakter HTML yang bisa digunakan untuk XSS stored attack
   * jika nama ditampilkan di UI tanpa escaping.
   */
  @Transform(({ value }: { value: unknown }): string | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return undefined;
    return value
      .replace(/\x00/g, '')   // Buang null-byte
      .replace(/[<>'"]/g, '') // Buang karakter HTML berbahaya
      .trim();
  })
  @IsString({ message: 'Nama harus berupa string' })
  @IsOptional()
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  fullName?: string;
}
