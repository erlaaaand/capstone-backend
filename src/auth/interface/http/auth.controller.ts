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

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.orchestrator.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.orchestrator.login(dto);
  }

  /**
   * GET /auth/me — contoh endpoint protected.
   * Membuktikan @CurrentUser decorator & JwtAuthGuard bekerja.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
