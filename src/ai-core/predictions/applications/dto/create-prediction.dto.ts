// src/predictions/applications/dto/create-prediction.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

function isSafeImageUrl(value: string): boolean {
  let parsed: URL;
  try { parsed = new URL(value); } catch { return false; }
  if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) return false;
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (hostname === '169.254.169.254') return false;
  if (
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname)
  ) return false;
  if (hostname === '::1' || hostname === '[::1]') return false;
  return true;
}

export class CreatePredictionDto {
  @ApiProperty({
    description:
      'URL publik gambar durian yang akan diklasifikasi. ' +
      'Dapatkan URL ini dari response `POST /api/v1/storage/upload`. ' +
      'Hanya HTTP/HTTPS diizinkan. Alamat jaringan internal diblokir.',
    example: 'http://localhost:3000/uploads/predictions/user-id/abc12345.jpg',
    maxLength: 512,
  })
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\x00/g, '').trim();
  })
  @IsString({ message: 'imageUrl harus berupa string' })
  @IsNotEmpty({ message: 'imageUrl wajib diisi' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'imageUrl harus berupa URL yang valid (http/https)' },
  )
  @MaxLength(512, { message: 'imageUrl maksimal 512 karakter' })
  imageUrl: string = '';

  static isSafeImageUrl(url: string): boolean {
    return isSafeImageUrl(url);
  }
}
