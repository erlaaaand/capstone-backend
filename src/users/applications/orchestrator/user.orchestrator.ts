// src/users/applications/orchestrator/user.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { FindUserByIdUseCase } from '../use-cases/find-user-by-id.use-case';
import { FindUserByEmailUseCase } from '../use-cases/find-user-by-email.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';

/**
 * Orchestrator berperan sebagai fasad tunggal antara HTTP layer dan use-cases.
 * Controller TIDAK boleh mengimport use-case secara langsung.
 */
@Injectable()
export class UserOrchestrator {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly findById: FindUserByIdUseCase,
    private readonly findByEmail: FindUserByEmailUseCase,
    private readonly updateUser: UpdateUserUseCase,
  ) {}

  register(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUser.execute(dto);
  }

  getById(id: string): Promise<UserResponseDto> {
    return this.findById.execute(id);
  }

  getByEmail(email: string): Promise<UserResponseDto> {
    return this.findByEmail.execute(email);
  }

  update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.updateUser.execute(id, dto);
  }
}
