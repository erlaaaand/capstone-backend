// src/storage/infrastructures/adapters/s3-storage.adapter.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  RawUploadedFile,
  StoredFile,
} from '../../domains/entities/stored-file.entity';
import { IStorageAdapter } from './storage.adapter.interface';

@Injectable()
export class S3StorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.getOrThrow<string>('AWS_REGION');
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    this.cdnBaseUrl = this.config.get<string>('AWS_CLOUDFRONT_URL') ?? null;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(file: RawUploadedFile, fileKey: string): Promise<StoredFile> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimeType,
        ContentLength: file.sizeInBytes,
        Metadata: {
          originalName: encodeURIComponent(file.originalName),
        },
      });

      await this.client.send(command);

      this.logger.log(`[S3] File uploaded → s3://${this.bucket}/${fileKey}`);

      return {
        fileKey,
        imageUrl: this.buildPublicUrl(fileKey),
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeInBytes: file.sizeInBytes,
        provider: 's3',
        uploadedAt: new Date(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[S3] Upload failed → ${message}`);

      if (message.includes('NetworkingError') || message.includes('ECONNREFUSED')) {
        throw new ServiceUnavailableException('AWS S3 tidak dapat dijangkau saat ini');
      }

      throw new InternalServerErrorException(
        `Gagal mengupload file ke S3: ${message}`,
      );
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.client.send(command);
      this.logger.log(`[S3] File deleted → s3://${this.bucket}/${fileKey}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[S3] Delete failed → ${message}`);
    }
  }

  buildPublicUrl(fileKey: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${fileKey}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }
}
