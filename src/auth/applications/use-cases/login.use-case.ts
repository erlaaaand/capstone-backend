// src/auth/applications/use-cases/login.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthValidator } from '../../domains/validators/auth.validator';
import { AuthMapper } from '../../domains/mappers/auth.mapper';
import { TokenService } from '../../domains/services/token.service';
import {
  type IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../users/infrastructures/repositories/user.repository.interface';
import { UserLoggedInEvent } from '../../infrastructures/events/user-logged-in.event';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: IUserRepository,
    private readonly validator: AuthValidator,
    private readonly mapper: AuthMapper,
    private readonly tokenService: TokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // 1. Cari user by email (select password included)
    const user = await this.userRepo.findByEmail(
      dto.email.toLowerCase().trim(),
    );

    // 2. Validasi keberadaan & status (pesan generic untuk keamanan)
    this.validator.assertUserExists(user);
    this.validator.assertUserIsActive(user);

    // 3. Validasi password
    await this.validator.assertPasswordValid(dto.password, user.password);

    // 4. Generate JWT
    const payload = this.mapper.toJwtPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const expiresIn = this.tokenService.getExpiresIn();

    // 5. Emit event login
    this.eventEmitter.emit(
      'auth.user_logged_in',
      new UserLoggedInEvent(user.id, user.email, new Date()),
    );

    return this.mapper.toAuthResponseDto(accessToken, expiresIn, user);
  }
}
