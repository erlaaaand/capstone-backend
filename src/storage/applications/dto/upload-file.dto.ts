// src/storage/applications/dto/upload-file.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type StorageProvider = 'local' | 's3';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Sub-folder penyimpanan. Contoh: predictions, avatars',
    example:     'predictions',
    maxLength:   50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  context?: string;

  @ApiPropertyOptional({
    description: 'Storage provider yang digunakan.',
    enum:        ['local', 's3'],
    example:     'local',
  })
  @IsIn(['local', 's3'])
  @IsOptional()
  provider?: StorageProvider;
}
