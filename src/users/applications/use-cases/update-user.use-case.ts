// src/users/applications/use-cases/update-user.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserDomainService } from '../../domains/services/user-domain.service';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserValidator } from '../../domains/validators/user.validator';
import { USER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/user.repository.interface';
import type { IUserRepository } from '../../infrastructures/repositories/user.repository.interface';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: IUserRepository,
    private readonly domainService: UserDomainService,
    private readonly validator: UserValidator,
    private readonly mapper: UserMapper,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findByEmail(
      (await this.userRepo.findById(id))?.email ?? '',
    );
    this.validator.assertExists(user, id);
    this.validator.assertIsActive(user);

    const updatePayload: Record<string, string | null> = {};

    if (dto.fullName !== undefined) {
      updatePayload.fullName = dto.fullName;
    }

    if (dto.newPassword && dto.currentPassword) {
      await this.validator.assertPasswordMatch(
        dto.currentPassword,
        user.password,
      );
      updatePayload.password = await this.domainService.hashPassword(
        dto.newPassword,
      );
    }

    const updated = await this.userRepo.update(id, updatePayload);
    return this.mapper.toResponseDto(updated);
  }
}
