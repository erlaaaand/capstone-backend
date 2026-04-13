// src/auth/interface/http/auth.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Post, UseFilters, UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth, ApiCreatedResponse, ApiOkResponse,
  ApiOperation, ApiTags, ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse, ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthOrchestrator } from '../../applications/orchestrator/auth.orchestrator';
import { LoginDto } from '../../applications/dto/login.dto';
import { RegisterDto } from '../../applications/dto/register.dto';
import { AuthResponseDto } from '../../applications/dto/auth-response.dto';
import { AuthExceptionFilter } from '../filters/auth-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../../domains/entities/jwt-payload.entity';

@ApiTags('Auth')
@ApiBearerAuth('JWT')
@Controller('auth')
@UseFilters(AuthExceptionFilter)
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly orchestrator: AuthOrchestrator) {}

  // ── Register ───────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:     'Daftar akun baru',
    description:
      'Membuat akun pengguna baru. JWT token langsung dikembalikan ' +
      'sehingga user bisa langsung mengakses endpoint lain.\n\n' +
      '**Tidak memerlukan autentikasi.**\n\n' +
      '**Rate limit**: 5 request/menit per IP.',
    operationId: 'authRegister',
  })
  @ApiCreatedResponse({
    type:        AuthResponseDto,
    description: 'Registrasi berhasil. Gunakan `accessToken` di header `Authorization: Bearer <token>`.',
  })
  @ApiBadRequestResponse({
    description: 'Validasi gagal — email format salah, password terlalu lemah, dll.',
    schema: {
      example: {
        statusCode: 400,
        message: ['Format email tidak valid', 'Password minimal 8 karakter'],
        error: 'BadRequestException',
        module: 'auth',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email sudah terdaftar.',
    schema: { example: { statusCode: 409, message: "Email 'x@y.com' sudah digunakan", error: 'ConflictException', module: 'auth' } },
  })
  @ApiTooManyRequestsResponse({ description: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.orchestrator.register(dto);
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:     'Login',
    description:
      'Login dengan email dan password. Mengembalikan JWT access token.\n\n' +
      '**Tidak memerlukan autentikasi.**\n\n' +
      '**Rate limit**: 5 request/menit per IP.\n\n' +
      '**Security**: Menggunakan constant-time comparison untuk mencegah timing attack.\n\n' +
      'Simpan `accessToken` dan gunakan di setiap request berikutnya:\n' +
      '```\nAuthorization: Bearer <accessToken>\n```',
    operationId: 'authLogin',
  })
  @ApiOkResponse({
    type:        AuthResponseDto,
    description: 'Login berhasil. Simpan `accessToken` untuk digunakan di request selanjutnya.',
  })
  @ApiUnauthorizedResponse({
    description: 'Email atau password salah.',
    schema: { example: { statusCode: 401, message: 'Email atau password tidak valid', error: 'UnauthorizedException', module: 'auth' } },
  })
  @ApiTooManyRequestsResponse({ description: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.orchestrator.login(dto);
  }

  // ── Me ─────────────────────────────────────────────────────────────────────

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:     'Info user yang sedang login',
    description: 'Mengembalikan data user berdasarkan JWT token yang aktif.',
    operationId: 'authMe',
  })
  @ApiOkResponse({
    description: 'Data user berhasil diambil.',
    schema: {
      example: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email:  'user@example.com',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak ada atau expired.' })
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({
    summary: 'Logout pengguna',
    description: 'Melakukan proses logout pengguna (misalnya invalidasi token aktif).',
    operationId: 'authLogout',
  })
  @ApiOkResponse({
    description: 'Logout berhasil',
    schema: {
      example: { message: 'Logout berhasil' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid atau sudah expired' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.orchestrator.logout(user.sub);
  }
}
