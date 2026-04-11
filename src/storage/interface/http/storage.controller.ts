// src/storage/interface/http/storage.controller.ts
import {
  BadRequestException,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { StorageOrchestrator } from '../../applications/orchestrator/storage.orchestrator';
import { UploadFileDto } from '../../applications/dto/upload-file.dto';
import { StorageResponseDto } from '../../applications/dto/storage-response.dto';
import { StorageExceptionFilter } from '../filters/storage-exception.filter';
import { FileUploadInterceptor } from '../interceptors/file-upload.interceptor';
import { FileSizeGuard } from '../guards/file-size.guard';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interface/decorators/current-user.decorator';

/** Karakter yang diizinkan dalam fileKey hasil decode base64 */
const SAFE_FILEKEY_PATTERN = /^[a-zA-Z0-9/_\-\.]+$/;

/** Mencegah path traversal dalam fileKey */
function isSafeFileKey(key: string): boolean {
  if (!key || key.trim().length === 0) return false;
  // Tolak path traversal sequences
  if (key.includes('..') || key.includes('//')) return false;
  // Tolak absolute path
  if (key.startsWith('/') || key.startsWith('\\')) return false;
  // Hanya izinkan karakter yang aman
  return SAFE_FILEKEY_PATTERN.test(key);
}

@ApiTags('Storage')
@ApiBearerAuth('JWT')
@Controller('storage')
@UseFilters(StorageExceptionFilter)
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly orchestrator: StorageOrchestrator) {}

  /**
   * POST /api/v1/storage/upload
   *
   * FIX [CRITICAL — IDOR]: userId sekarang diambil dari JWT,
   * BUKAN dari request body. Client tidak bisa menentukan
   * userId sendiri untuk mengklaim file milik user lain.
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(FileSizeGuard)
  @UseInterceptors(FileUploadInterceptor)
  @ApiOperation({
    summary:     'Upload gambar',
    description:
      'Upload file gambar (JPG/PNG/WebP, maks 5MB). ' +
      'userId diambil otomatis dari JWT — tidak perlu dikirim di body.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File gambar + optional context/provider',
    schema: {
      type:       'object',
      required:   ['file'],
      properties: {
        file: {
          type:   'string',
          format: 'binary',
          description: 'File gambar (JPG/PNG/WebP, maks 5MB)',
        },
        context: {
          type:    'string',
          example: 'predictions',
          description: 'Sub-folder penyimpanan (opsional)',
        },
        provider: {
          type:    'string',
          enum:    ['local', 's3'],
          example: 'local',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type:        StorageResponseDto,
    description: 'File berhasil diupload. Gunakan imageUrl untuk prediksi.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  @ApiUnprocessableEntityResponse({
    description: 'File tidak ada, format tidak didukung, atau ukuran melebihi batas.',
  })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
    @CurrentUser('sub') authenticatedUserId: string,
  ): Promise<StorageResponseDto> {
    // FIX: userId dari JWT, bukan dari DTO
    return this.orchestrator.upload(file, dto, authenticatedUserId);
  }

  /**
   * DELETE /api/v1/storage/:fileKey
   *
   * FIX [HIGH]: Tambah validasi fileKey setelah base64 decode.
   *
   * SEBELUM: fileKey langsung di-decode dari base64 tanpa sanitasi apapun.
   *   Attacker bisa mengirim base64("../../secret/file") untuk path traversal,
   *   atau base64("/etc/passwd") untuk menghapus file sistem.
   *
   * SESUDAH:
   *   1. Decode base64.
   *   2. Validasi dengan isSafeFileKey() — blokir path traversal.
   *   3. (TODO future): ownership check — pastikan file milik user yang request.
   *      Perlu index fileKey→userId di DB untuk implementasi penuh.
   */
  @Delete(':fileKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:     'Hapus file',
    description:
      'Hapus file dari storage. fileKey di-encode sebagai base64url ' +
      'untuk menghindari konflik path separator di URL.',
  })
  @ApiParam({
    name:        'fileKey',
    description: 'Base64url-encoded file key dari response upload.',
    example:     'cHJlZGljdGlvbnMvdXNlci1pZC9maWxlLmpwZw==',
  })
  @ApiNoContentResponse({ description: 'File berhasil dihapus.' })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  delete(@Param('fileKey') encodedFileKey: string): Promise<void> {
    // FIX: Decode + validasi untuk mencegah path traversal
    let fileKey: string;
    try {
      fileKey = Buffer.from(encodedFileKey, 'base64').toString('utf-8').trim();
    } catch {
      throw new BadRequestException('fileKey tidak valid (bukan base64 yang valid).');
    }

    if (!isSafeFileKey(fileKey)) {
      throw new BadRequestException(
        'fileKey mengandung karakter tidak diizinkan atau pola path traversal.',
      );
    }

    return this.orchestrator.delete(fileKey);
  }
}
