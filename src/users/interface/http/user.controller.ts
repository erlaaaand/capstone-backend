// src/users/interface/http/user.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserOrchestrator } from '../../applications/orchestrator/user.orchestrator';
import { UpdateUserDto } from '../../applications/dto/update-user.dto';
import { UserResponseDto } from '../../applications/dto/user-response.dto';
import { UserExceptionFilter } from '../filters/user-exception.filter';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interface/decorators/current-user.decorator';

/**
 * UserController — endpoint manajemen profil pengguna.
 *
 * SECURITY FIXES:
 * 1. FIX [CRITICAL]: Endpoint POST /users/register DIHAPUS.
 *    Registrasi user sudah ada di POST /auth/register (AuthController).
 *    Duplikasi endpoint ini adalah celah keamanan karena tidak ada rate-limit
 *    di sini dan bisa di-exploit untuk account creation bypass.
 *
 * 2. FIX [CRITICAL]: Semua endpoint kini dilindungi @UseGuards(JwtAuthGuard).
 *    Sebelumnya GET/:id dan PATCH/:id bisa diakses tanpa autentikasi apapun.
 *
 * 3. FIX [CRITICAL]: Ownership check — user hanya bisa GET/PATCH data dirinya sendiri.
 *    Sebelumnya user A bisa mengambil/mengubah profil user B hanya dengan mengganti
 *    UUID di URL (IDOR vulnerability).
 */
@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseFilters(UserExceptionFilter)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly orchestrator: UserOrchestrator) {}

  /**
   * GET /api/v1/users/me
   *
   * Endpoint baru — user selalu melihat profilnya sendiri via JWT,
   * bukan via UUID di URL (eliminasi IDOR).
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Lihat profil saya',
    description: 'Mengambil data profil user yang sedang login berdasarkan JWT token.',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'Data profil berhasil diambil.' })
  @ApiUnauthorizedResponse({ description: 'Token tidak ada atau tidak valid.' })
  getMe(
    @CurrentUser('sub') userId: string,
  ): Promise<UserResponseDto> {
    return this.orchestrator.getById(userId);
  }

  /**
   * GET /api/v1/users/:id
   *
   * FIX [CRITICAL]: Ownership check — hanya boleh mengakses data milik sendiri.
   * Admin access bisa ditambahkan dengan role guard di masa depan.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Lihat profil berdasarkan ID',
    description: 'Hanya bisa mengakses profil milik sendiri (sesuai JWT).',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'UUID user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token tidak ada atau tidak valid.' })
  @ApiForbiddenResponse({ description: 'Tidak boleh mengakses profil user lain.' })
  @ApiNotFoundResponse({ description: 'User tidak ditemukan.' })
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<UserResponseDto> {
    // FIX: Pastikan user hanya bisa akses data dirinya sendiri
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengakses profil user lain.',
      );
    }
    return this.orchestrator.getById(id);
  }

  /**
   * PATCH /api/v1/users/:id
   *
   * FIX [CRITICAL]: Ownership check — user hanya bisa update dirinya sendiri.
   * requestingUserId di-pass ke use case untuk double-check di domain layer.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Update profil',
    description:
      'Update nama atau password. Hanya bisa mengubah profil milik sendiri.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Profil berhasil diperbarui.' })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  @ApiForbiddenResponse({ description: 'Tidak boleh mengubah profil user lain.' })
  @ApiNotFoundResponse({ description: 'User tidak ditemukan.' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<UserResponseDto> {
    // FIX: Cek ownership di controller layer sebelum masuk use case
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengubah profil user lain.',
      );
    }
    return this.orchestrator.update(id, dto, requestingUserId);
  }
}
