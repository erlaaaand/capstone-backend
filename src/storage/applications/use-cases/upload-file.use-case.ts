// src/storage/applications/use-cases/upload-file.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadFileDto } from '../dto/upload-file.dto';
import { StorageResponseDto } from '../dto/storage-response.dto';
import { StorageDomainService } from '../../domains/services/storage-domain.service';
import { StorageMapper } from '../../domains/mappers/storage.mapper';
import { FileValidator } from '../../domains/validators/file.validator';
import {
  type IStorageAdapter,
  STORAGE_ADAPTER_TOKEN,
} from '../../infrastructures/adapters/storage.adapter.interface';
import { FileUploadedEvent } from '../../infrastructures/events/file-uploaded.event';

@Injectable()
export class UploadFileUseCase {
  constructor(
    @Inject(STORAGE_ADAPTER_TOKEN)
    private readonly storageAdapter: IStorageAdapter,
    private readonly domainService: StorageDomainService,
    private readonly validator: FileValidator,
    private readonly mapper: StorageMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
  ): Promise<StorageResponseDto> {
    // 1. Validasi file
    this.validator.assertAll(file);

    // 2. Generate unique file key
    const context = dto.context ?? 'general';
    const fileKey = this.domainService.generateFileKey(
      file.originalname,
      dto.userId,
      context,
    );

    // 3. Map ke domain entity
    const rawFile = this.mapper.toRawUploadedFile(file);

    // 4. Upload via adapter (local/s3 — transparan)
    const stored = await this.storageAdapter.upload(rawFile, fileKey);

    // 5. Emit event
    this.eventEmitter.emit(
      'storage.file_uploaded',
      new FileUploadedEvent(
        stored.fileKey,
        stored.imageUrl,
        dto.userId,
        context,
        new Date(),
      ),
    );

    return this.mapper.toResponseDto(stored);
  }
}
