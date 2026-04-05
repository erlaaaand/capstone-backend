// src/users/applications/dto/update-user.dto.ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  currentPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  newPassword?: string;
}
