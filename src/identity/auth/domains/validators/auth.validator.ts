// src/auth/domains/validators/auth.validator.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../users/domains/entities/user.entity';

const DUMMY_HASH =
  '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

@Injectable()
export class AuthValidator {

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
