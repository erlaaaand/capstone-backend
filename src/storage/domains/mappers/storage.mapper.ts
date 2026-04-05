// src/storage/domains/mappers/storage.mapper.ts
import { Injectable } from '@nestjs/common';
import { StoredFile } from '../entities/stored-file.entity';
import { StorageResponseDto } from '../../applications/dto/storage-response.dto';
import { RawUploadedFile } from '../entities/stored-file.entity';

@Injectable()
export class StorageMapper {
  toRawUploadedFile(file: Express.Multer.File): RawUploadedFile {
    return {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeInBytes: file.size,
    };
  }

  toResponseDto(stored: StoredFile): StorageResponseDto {
    return {
      fileKey: stored.fileKey,
      imageUrl: stored.imageUrl,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeInBytes: stored.sizeInBytes,
      provider: stored.provider,
      uploadedAt: stored.uploadedAt,
    };
  }
}
