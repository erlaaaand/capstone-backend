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
    /**
     * FIX [HIGH-02]: Urutan operasi diubah untuk mencegah timing attack.
     *
     * SEBELUM (rentan timing attack):
     *   1. findByEmail → jika tidak ada, throw LANGSUNG (cepat)
     *   2. assertUserExists → throw jika null
     *   3. assertPasswordValid → bcrypt.compare (lambat)
     *
     * SESUDAH (constant-time):
     *   1. findByEmail → simpan hasilnya (mungkin null)
     *   2. assertPasswordValid → SELALU jalankan bcrypt
     *      (pakai dummy hash jika user tidak ada)
     *   3. assertUserExists → throw jika null (setelah bcrypt selesai)
     *   4. assertUserIsActive → throw jika inactive
     *
     * Dengan urutan ini, response time untuk email valid dan tidak valid
     * sama-sama menunggu bcrypt — attacker tidak bisa membedakan keduanya.
     *
     * Email sudah di-normalize (lowercase + trim) oleh @Transform di DTO,
     * sehingga tidak perlu normalisasi ulang di sini.
     */

    // 1. Cari user — tidak throw meski null
    const user = await this.userRepo.findByEmail(dto.email);

    // 2. SELALU jalankan bcrypt — pass null jika user tidak ada
    //    AuthValidator akan pakai DUMMY_HASH untuk null
    await this.validator.assertPasswordValid(
      dto.password,
      user?.password ?? null,
    );

    // 3. Setelah bcrypt selesai, baru validasi keberadaan user
    this.validator.assertUserExists(user);

    // 4. Validasi status aktif
    this.validator.assertUserIsActive(user);

    // 5. Generate JWT
    const payload = this.mapper.toJwtPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const expiresIn = this.tokenService.getExpiresIn();

    // 6. Emit event login untuk audit trail
    this.eventEmitter.emit(
      'auth.user_logged_in',
      new UserLoggedInEvent(user.id, user.email, new Date()),
    );

    return this.mapper.toAuthResponseDto(accessToken, expiresIn, user);
  }
}
