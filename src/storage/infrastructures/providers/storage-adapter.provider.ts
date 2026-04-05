// src/storage/infrastructures/providers/storage-adapter.provider.ts
import { ConfigService } from '@nestjs/config';
import { STORAGE_ADAPTER_TOKEN } from '../adapters/storage.adapter.interface';
import { LocalStorageAdapter } from '../adapters/local-storage.adapter';
import { S3StorageAdapter } from '../adapters/s3-storage.adapter';

/**
 * Provider dinamis — membaca STORAGE_PROVIDER dari env.
 * Nilai: 'local' | 's3'
 * Default: 'local'
 *
 * Untuk switch provider: cukup ubah env var, zero code change.
 */
export const StorageAdapterProvider = {
  provide: STORAGE_ADAPTER_TOKEN,
  inject: [ConfigService, LocalStorageAdapter, S3StorageAdapter],
  useFactory: (
    config: ConfigService,
    localAdapter: LocalStorageAdapter,
    s3Adapter: S3StorageAdapter,
  ): LocalStorageAdapter | S3StorageAdapter => {
    const provider = config.get<string>('STORAGE_PROVIDER', 'local');

    if (provider === 's3') {
      return s3Adapter;
    }

    return localAdapter;
  },
};
