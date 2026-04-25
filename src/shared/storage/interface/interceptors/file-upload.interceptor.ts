// src/storage/interface/interceptors/file-upload.interceptor.ts
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
const storageEngine = multer.memoryStorage();

const multerOptions: MulterOptions = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  storage: storageEngine,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
};

/**
 * Interceptor standar untuk semua upload file di module ini.
 */
export const FileUploadInterceptor = FileInterceptor('file', multerOptions);
