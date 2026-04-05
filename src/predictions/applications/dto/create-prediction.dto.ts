// src/predictions/applications/dto/create-prediction.dto.ts
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePredictionDto {
  @IsUUID('4', { message: 'userId harus berupa UUID v4 yang valid' })
  @IsNotEmpty({ message: 'userId wajib diisi' })
  userId: string = '';

  @IsString()
  @IsNotEmpty({ message: 'imageUrl wajib diisi' })
  @MaxLength(512)
  imageUrl: string = '';
}
