// src/storage/applications/dto/upload-file.dto.ts
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export type StorageProvider = 'local' | 's3';

export class UploadFileDto {
  @IsUUID('4', { message: 'userId harus berupa UUID v4 yang valid' })
  userId: string = '';

  /**
   * Context menentukan sub-folder penyimpanan.
   * Contoh: 'predictions', 'avatars'
   */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  context?: string;

  /**
   * Override provider jika ingin spesifik.
   * Default: ambil dari STORAGE_PROVIDER env.
   */
  @IsIn(['local', 's3'])
  @IsOptional()
  provider?: StorageProvider;
}
