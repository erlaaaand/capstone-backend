// src/auth/applications/dto/auth-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID user' })
  id: string = '';

  @ApiProperty({ example: 'user@example.com' })
  email: string = '';

  @ApiPropertyOptional({ example: 'Budi Santoso', nullable: true })
  fullName: string | null = null;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token. Sertakan di header: Authorization: Bearer <token>',
    example:     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string = '';

  @ApiProperty({ example: 'Bearer', description: 'Tipe token' })
  tokenType: string = 'Bearer';

  @ApiProperty({ example: '7d', description: 'Durasi token valid' })
  expiresIn: string = '';

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto = new AuthUserDto();
}
