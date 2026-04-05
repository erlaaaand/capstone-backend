// src/storage/interface/interceptors/file-upload.interceptor.ts
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

/**
 * Interceptor standar untuk semua upload file di module ini.
 * Menggunakan memoryStorage — buffer ditangani oleh storage adapter,
 * bukan ditulis langsung ke disk oleh Multer.
 */
export const FileUploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB hard limit di level Multer
    files: 1,
  },
});
