// src/users/applications/orchestrator/user.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { FindUserByIdUseCase } from '../use-cases/find-user-by-id.use-case';
import { FindUserByEmailUseCase } from '../use-cases/find-user-by-email.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';

@Injectable()
export class UserOrchestrator {
  constructor(
    private readonly createUser:    CreateUserUseCase,
    private readonly findById:      FindUserByIdUseCase,
    private readonly findByEmail:   FindUserByEmailUseCase,
    private readonly updateUser:    UpdateUserUseCase,
  ) {}

  getById(id: string): Promise<UserResponseDto> {
    return this.findById.execute(id);
  }

  getByEmail(email: string): Promise<UserResponseDto> {
    return this.findByEmail.execute(email);
  }

  update(
    id: string,
    dto: UpdateUserDto,
    requestingUserId: string,
  ): Promise<UserResponseDto> {
    return this.updateUser.execute(id, dto, requestingUserId);
  }
}