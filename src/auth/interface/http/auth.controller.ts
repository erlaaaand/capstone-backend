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
@Controller('auth')
@UseFilters(AuthExceptionFilter)
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly orchestrator: AuthOrchestrator) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:     'Daftar akun baru',
    description:
      'Membuat akun pengguna baru. Dikembalikan JWT token langsung ' +
      'sehingga user bisa langsung mengakses endpoint lain.\n\n' +
      '**Rate limit**: 5 request/menit per IP.',
  })
  @ApiCreatedResponse({
    type:        AuthResponseDto,
    description: 'Registrasi berhasil. Gunakan `accessToken` untuk request berikutnya.',
  })
  @ApiBadRequestResponse({ description: 'Validasi gagal (email format salah, password lemah, dll).' })
  @ApiConflictResponse({ description: 'Email sudah terdaftar.' })
  @ApiTooManyRequestsResponse({ description: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.orchestrator.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:     'Login',
    description:
      'Login dengan email dan password. Mengembalikan JWT access token.\n\n' +
      '**Rate limit**: 5 request/menit per IP.\n\n' +
      '**Security**: Menggunakan constant-time comparison untuk mencegah timing attack.',
  })
  @ApiOkResponse({
    type:        AuthResponseDto,
    description: 'Login berhasil. Simpan `accessToken` untuk digunakan di request selanjutnya.',
  })
  @ApiUnauthorizedResponse({ description: 'Email atau password salah.' })
  @ApiTooManyRequestsResponse({ description: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.orchestrator.login(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:     'Info user saat ini',
    description: 'Mengembalikan data user yang sedang login berdasarkan JWT token.',
  })
  @ApiOkResponse({
    schema: {
      example: { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'user@example.com' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak ada atau expired.' })
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
