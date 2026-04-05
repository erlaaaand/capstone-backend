// src/storage/domains/entities/stored-file.entity.ts

/**
 * Pure domain value object — bukan TypeORM entity.
 * Merepresentasikan file yang sudah berhasil disimpan di storage.
 */
export class StoredFile {
  fileKey: string = '';
  imageUrl: string = '';
  originalName: string = '';
  mimeType: string = '';
  sizeInBytes: number = 0;
  provider: 'local' | 's3' = 'local';
  uploadedAt: Date = new Date();
}

/**
 * Raw file yang diterima dari multipart upload sebelum diproses.
 */
export class RawUploadedFile {
  buffer: Buffer = Buffer.alloc(0);
  originalName: string = '';
  mimeType: string = '';
  sizeInBytes: number = 0;
}
