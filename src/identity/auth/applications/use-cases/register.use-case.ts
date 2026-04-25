// src/auth/applications/use-cases/register.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthMapper } from '../../domains/mappers/auth.mapper';
import { TokenService } from '../../domains/services/token.service';
import { CreateUserUseCase } from '../../../users/applications/use-cases/create-user.use-case';
import { CreateUserDto } from '../../../users/applications/dto/create-user.dto';
import {
  type IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../users/infrastructures/repositories/user.repository.interface';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,

    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: IUserRepository,

    private readonly mapper: AuthMapper,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const createDto: CreateUserDto = {
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    };

    const user = await this.createUserUseCase.executeAndReturnEntity(createDto);

    const payload = this.mapper.toJwtPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const expiresIn = this.tokenService.getExpiresIn();

    return this.mapper.toAuthResponseDto(accessToken, expiresIn, user);
  }
}
