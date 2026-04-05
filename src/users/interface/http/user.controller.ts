// src/users/interface/http/user.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { UserOrchestrator } from '../../applications/orchestrator/user.orchestrator';
import { CreateUserDto } from '../../applications/dto/create-user.dto';
import { UpdateUserDto } from '../../applications/dto/update-user.dto';
import { UserResponseDto } from '../../applications/dto/user-response.dto';
import { UserExceptionFilter } from '../filters/user-exception.filter';

@Controller('users')
@UseFilters(UserExceptionFilter)
export class UserController {
  constructor(private readonly orchestrator: UserOrchestrator) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.orchestrator.register(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.orchestrator.getById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.orchestrator.update(id, dto);
  }
}
