// src/storage/applications/orchestrator/storage.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { UploadFileDto } from '../dto/upload-file.dto';
import { StorageResponseDto } from '../dto/storage-response.dto';
import { UploadFileUseCase } from '../use-cases/upload-file.use-case';
import { DeleteFileUseCase } from '../use-cases/delete-file.use-case';

@Injectable()
export class StorageOrchestrator {
  constructor(
    private readonly uploadFile: UploadFileUseCase,
    private readonly deleteFile: DeleteFileUseCase,
  ) {}

  upload(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
  ): Promise<StorageResponseDto> {
    return this.uploadFile.execute(file, dto);
  }

  delete(fileKey: string): Promise<void> {
    return this.deleteFile.execute(fileKey);
  }
}
