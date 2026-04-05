// src/users/applications/dto/user-response.dto.ts
export class UserResponseDto {
  id: string = '';
  email: string = '';
  fullName: string | null = null;
  isActive: boolean = false;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
