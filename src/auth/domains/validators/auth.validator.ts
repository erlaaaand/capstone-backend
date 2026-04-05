// src/auth/domains/validators/auth.validator.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../users/domains/entities/user.entity';

@Injectable()
export class AuthValidator {
  assertUserExists(user: UserEntity | null): asserts user is UserEntity {
    if (!user) {
      // Pesan generic — tidak membocorkan apakah email terdaftar atau tidak
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
    hashedPassword: string,
  ): Promise<void> {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Email atau password tidak valid');
    }
  }
}
