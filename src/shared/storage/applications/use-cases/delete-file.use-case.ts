// src/storage/applications/use-cases/delete-file.use-case.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type IStorageAdapter,
  STORAGE_ADAPTER_TOKEN,
} from '../../infrastructures/adapters/storage.adapter.interface';

@Injectable()
export class DeleteFileUseCase {
  private readonly logger = new Logger(DeleteFileUseCase.name);

  constructor(
    @Inject(STORAGE_ADAPTER_TOKEN)
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  async execute(fileKey: string): Promise<void> {
    this.logger.log(`[DeleteFile] Deleting → key=${fileKey}`);
    await this.storageAdapter.delete(fileKey);
  }
}
