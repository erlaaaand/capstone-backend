// src/auth/applications/dto/auth-response.dto.ts
export class AuthUserDto {
  id: string = '';
  email: string = '';
  fullName: string | null = null;
}

export class AuthResponseDto {
  accessToken: string = '';
  tokenType: string = 'Bearer';
  expiresIn: string = '';
  user: AuthUserDto = new AuthUserDto();
}
