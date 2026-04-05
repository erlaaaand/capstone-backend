// src/storage/infrastructures/adapters/storage.adapter.interface.ts
import {
  RawUploadedFile,
  StoredFile,
} from '../../domains/entities/stored-file.entity';

export interface IStorageAdapter {
  upload(file: RawUploadedFile, fileKey: string): Promise<StoredFile>;
  delete(fileKey: string): Promise<void>;
  buildPublicUrl(fileKey: string): string;
}

export const STORAGE_ADAPTER_TOKEN = Symbol('IStorageAdapter');
