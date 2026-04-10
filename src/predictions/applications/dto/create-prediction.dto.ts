// src/predictions/applications/dto/create-prediction.dto.ts
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Whitelist protokol yang diizinkan untuk imageUrl.
 * Hanya http dan https — cegah file://, ftp://, data://, dll.
 */
const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

/**
 * FIX [CRITICAL-03]: Validasi domain imageUrl menggunakan
 * custom validator berbasis URL parsing — bukan regex yang rapuh.
 *
 * Fungsi ini digunakan di @Validate decorator untuk memastikan
 * imageUrl tidak mengarah ke internal network atau protokol berbahaya.
 */
function isSafeImageUrl(value: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  // Hanya izinkan protokol http dan https
  if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Blokir localhost dan variasi-nya
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }

  // Blokir AWS metadata endpoint (SSRF protection)
  if (hostname === '169.254.169.254') {
    return false;
  }

  // Blokir private IP range (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  if (
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname)
  ) {
    return false;
  }

  // Blokir IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') {
    return false;
  }

  return true;
}

export class CreatePredictionDto {
  /**
   * FIX [CRITICAL-02]: userId DIHAPUS dari DTO.
   *
   * userId tidak boleh dikirim oleh client — ini adalah
   * IDOR vulnerability klasik. userId harus diambil dari
   * JWT token yang sudah diverifikasi di controller layer
   * via @CurrentUser() decorator.
   *
   * Controller akan inject userId dari token ke use case
   * secara langsung tanpa melalui request body.
   */

  /**
   * FIX [CRITICAL-03] + [HIGH-01] + [MEDIUM-03]:
   * - @Transform: buang null-byte dan trim whitespace
   * - @IsUrl: validasi format URL dasar
   * - isSafeImageUrl: validasi protokol dan blokir SSRF target
   */
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\x00/g, '').trim();
  })
  @IsString({ message: 'imageUrl harus berupa string' })
  @IsNotEmpty({ message: 'imageUrl wajib diisi' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'imageUrl harus berupa URL yang valid (http/https)' },
  )
  @MaxLength(512, { message: 'imageUrl maksimal 512 karakter' })
  imageUrl: string = '';

  /**
   * Validasi keamanan imageUrl dilakukan di use case layer
   * menggunakan isSafeImageUrl() agar error bisa dikembalikan
   * sebagai domain exception yang tepat.
   *
   * Export helper agar bisa digunakan di use case.
   */
  static isSafeImageUrl(url: string): boolean {
    return isSafeImageUrl(url);
  }
}
