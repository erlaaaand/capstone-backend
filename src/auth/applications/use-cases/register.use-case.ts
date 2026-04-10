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
    /**
     * FIX [HIGH-01]: Hilangkan double query.
     *
     * SEBELUM:
     *   1. createUserUseCase.execute() → INSERT (return UserResponseDto)
     *   2. userRepo.findByEmail() → SELECT ulang (query redundan!)
     *   3. user! non-null assertion (unsafe)
     *
     * SESUDAH:
     *   CreateUserUseCase di-refactor untuk return UserEntity langsung
     *   melalui method executeAndReturnEntity() sehingga tidak perlu
     *   SELECT ulang ke database.
     *
     *   Alternatif tanpa refactor CreateUserUseCase:
     *   Kita inject UserRepository langsung dan gunakan hasil
     *   dari create() yang sudah return entity — lebih efisien
     *   karena data sudah ada di memory setelah INSERT.
     *
     * Email sudah di-normalize oleh @Transform di RegisterDto,
     * CreateUserDto juga akan melakukan normalisasi via DomainService
     * — tidak ada inkonsistensi.
     */
    const createDto: CreateUserDto = {
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    };

    // Dapatkan entity langsung dari use case yang sudah di-refactor
    const user = await this.createUserUseCase.executeAndReturnEntity(createDto);

    // Generate token dari entity — tidak perlu query ulang ke DB
    const payload = this.mapper.toJwtPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const expiresIn = this.tokenService.getExpiresIn();

    return this.mapper.toAuthResponseDto(accessToken, expiresIn, user);
  }
}
