// src/predictions/applications/dto/find-predictions-query.dto.ts
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * FIX [INFO-03]: Query DTO untuk pagination pada endpoint
 * GET /predictions/user/:userId
 *
 * Tanpa pagination, user dengan ribuan prediksi akan
 * menyebabkan query berat dan response payload besar.
 */
export class FindPredictionsQueryDto {
  @Transform(({ value }: { value: unknown }): number => {
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsInt({ message: 'page harus berupa bilangan bulat' })
  @Min(1, { message: 'page minimal 1' })
  @IsOptional()
  page: number = 1;

  @Transform(({ value }: { value: unknown }): number => {
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? 10 : parsed;
  })
  @IsInt({ message: 'limit harus berupa bilangan bulat' })
  @Min(1, { message: 'limit minimal 1' })
  @Max(50, { message: 'limit maksimal 50 per halaman' })
  @IsOptional()
  limit: number = 10;
}
