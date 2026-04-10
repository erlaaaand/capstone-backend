// src/auth/interface/http/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthOrchestrator } from '../../applications/orchestrator/auth.orchestrator';
import { LoginDto } from '../../applications/dto/login.dto';
import { RegisterDto } from '../../applications/dto/register.dto';
import { AuthResponseDto } from '../../applications/dto/auth-response.dto';
import { AuthExceptionFilter } from '../filters/auth-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../../domains/entities/jwt-payload.entity';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly orchestrator: AuthOrchestrator) {}

  /**
   * FIX [CRITICAL-02]: Override throttle ke tier 'strict'.
   *
   * Register dibatasi 5 request per menit per IP untuk mencegah:
   * - Spam account creation
   * - Account enumeration attack
   * - Resource exhaustion (bcrypt hash mahal secara CPU)
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.orchestrator.register(dto);
  }

  /**
   * FIX [CRITICAL-01]: Override throttle ke tier 'strict'.
   *
   * Login dibatasi 5 request per menit per IP untuk mencegah:
   * - Brute force attack
   * - Credential stuffing
   *
   * Dikombinasikan dengan timing attack prevention di AuthValidator,
   * ini membuat serangan berbasis waktu dan volume menjadi tidak efektif.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.orchestrator.login(dto);
  }

  /**
   * FIX [INFO-02]: Tambah @SkipThrottle() pada endpoint read-only
   * yang sering dipanggil frontend untuk refresh user state.
   *
   * Endpoint ini sudah dilindungi JwtAuthGuard — hanya user
   * terautentikasi yang bisa mengaksesnya, sehingga aman di-skip throttle.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
