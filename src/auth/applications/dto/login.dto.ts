// src/auth/applications/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @MaxLength(255)
  email: string = '';

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MaxLength(128)
  password: string = '';
}
