// src/storage/applications/dto/storage-response.dto.ts
import { StorageProvider } from './upload-file.dto';

export class StorageResponseDto {
  fileKey: string = ''; // unique key di storage (path/S3 key)
  imageUrl: string = ''; // URL publik untuk akses file
  originalName: string = '';
  mimeType: string = '';
  sizeInBytes: number = 0;
  provider: StorageProvider = 'local';
  uploadedAt: Date = new Date();
}
