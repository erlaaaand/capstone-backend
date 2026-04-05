// src/users/applications/use-cases/create-user.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserDomainService } from '../../domains/services/user-domain.service';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserValidator } from '../../domains/validators/user.validator';
import { USER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/user.repository.interface';
import type { IUserRepository } from '../../infrastructures/repositories/user.repository.interface';
import { UserCreatedEvent } from '../../infrastructures/events/user-created.event';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: IUserRepository,
    private readonly domainService: UserDomainService,
    private readonly validator: UserValidator,
    private readonly mapper: UserMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const sanitizedEmail = this.domainService.sanitizeEmail(dto.email);

    const emailTaken = await this.userRepo.existsByEmail(sanitizedEmail);
    this.validator.assertEmailNotTaken(emailTaken, sanitizedEmail);

    const hashedPassword = await this.domainService.hashPassword(dto.password);

    const user = await this.userRepo.create({
      email: sanitizedEmail,
      password: hashedPassword,
      fullName: dto.fullName ?? null,
    });

    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(user.id, user.email, user.fullName, new Date()),
    );

    return this.mapper.toResponseDto(user);
  }
}
