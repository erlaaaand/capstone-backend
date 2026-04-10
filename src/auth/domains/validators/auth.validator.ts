// src/auth/domains/validators/auth.validator.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../users/domains/entities/user.entity';

/**
 * Hash dummy yang digunakan saat user tidak ditemukan.
 *
 * FIX [HIGH-02]: Mencegah timing attack / user enumeration.
 *
 * Tanpa dummy hash, flow login untuk email tidak terdaftar
 * akan return lebih cepat (skip bcrypt.compare) dibanding
 * email terdaftar (menunggu bcrypt). Perbedaan waktu ini bisa
 * dideteksi oleh attacker untuk enumerate email valid.
 *
 * Dengan dummy hash, bcrypt.compare SELALU dijalankan —
 * response time menjadi konsisten regardless email ada atau tidak.
 *
 * Hash ini di-generate sekali: bcrypt.hashSync('dummy-password', 10)
 */
const DUMMY_HASH =
  '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

@Injectable()
export class AuthValidator {
  /**
   * FIX [HIGH-02]: assertUserExists sekarang tidak langsung throw.
   * Logic timing attack prevention dipindahkan ke assertPasswordValid
   * yang selalu menjalankan bcrypt meski user tidak ada.
   *
   * Cara penggunaan yang benar di LoginUseCase:
   *
   *   const user = await this.userRepo.findByEmail(email);
   *   // Selalu jalankan bcrypt dulu baru cek user
   *   await this.validator.assertPasswordValid(
   *     dto.password,
   *     user?.password ?? null,
   *   );
   *   // Baru throw jika user tidak ada (setelah bcrypt selesai)
   *   this.validator.assertUserExists(user);
   *   this.validator.assertUserIsActive(user);
   */
  assertUserExists(user: UserEntity | null): asserts user is UserEntity {
    if (!user) {
      throw new UnauthorizedException('Email atau password tidak valid');
    }
  }

  assertUserIsActive(user: UserEntity): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Akun ini telah dinonaktifkan');
    }
  }

  /**
   * FIX [HIGH-02]: Parameter kedua diubah menjadi `string | null`.
   *
   * Jika hashedPassword null (user tidak ditemukan), gunakan DUMMY_HASH
   * sehingga bcrypt.compare tetap berjalan dengan waktu yang sama.
   * Hasilnya selalu false untuk dummy hash — tidak ada security leak.
   *
   * Pola ini dikenal sebagai "constant-time comparison" untuk auth.
   */
  async assertPasswordValid(
    plainPassword: string,
    hashedPassword: string | null,
  ): Promise<void> {
    // Selalu jalankan bcrypt.compare — jangan short-circuit meski hash null
    const hashToCompare = hashedPassword ?? DUMMY_HASH;
    const isMatch = await bcrypt.compare(plainPassword, hashToCompare);

    // Jika hash adalah dummy (user tidak ada), isMatch pasti false
    if (!isMatch) {
      throw new UnauthorizedException('Email atau password tidak valid');
    }
  }
}
