// src/storage/domains/mappers/storage.mapper.ts
import { Injectable } from '@nestjs/common';
import { StoredFile, RawUploadedFile } from '../entities/stored-file.entity';
import { StorageResponseDto } from '../../applications/dto/storage-response.dto';

export interface IUploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class StorageMapper {
  toRawUploadedFile(file: IUploadedFile): RawUploadedFile {
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
