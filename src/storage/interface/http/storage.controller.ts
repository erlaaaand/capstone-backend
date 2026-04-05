// src/storage/interface/http/storage.controller.ts
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StorageOrchestrator } from '../../applications/orchestrator/storage.orchestrator';
import { UploadFileDto } from '../../applications/dto/upload-file.dto';
import { StorageResponseDto } from '../../applications/dto/storage-response.dto';
import { StorageExceptionFilter } from '../filters/storage-exception.filter';
import { FileUploadInterceptor } from '../interceptors/file-upload.interceptor';
import { FileSizeGuard } from '../guards/file-size.guard';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';

@Controller('storage')
@UseFilters(StorageExceptionFilter)
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly orchestrator: StorageOrchestrator) {}

  /**
   * POST /api/v1/storage/upload
   * Upload file ke provider yang aktif (local/s3).
   * Requires: Authorization: Bearer <token>
   * Form fields: file (binary), userId (uuid), context? (string)
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(FileSizeGuard)
  @UseInterceptors(FileUploadInterceptor)
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
  ): Promise<StorageResponseDto> {
    return this.orchestrator.upload(file, dto);
  }

  /**
   * DELETE /api/v1/storage/:fileKey
   * Hapus file dari storage berdasarkan fileKey.
   * fileKey di-encode sebagai base64 untuk menghindari konflik path separator.
   */
  @Delete(':fileKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('fileKey') encodedFileKey: string): Promise<void> {
    const fileKey = Buffer.from(encodedFileKey, 'base64').toString('utf-8');
    return this.orchestrator.delete(fileKey);
  }
}
