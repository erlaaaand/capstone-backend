// ─── calculate-shipping.dto.ts ────────────────────────────────────────────────
import { IsString, IsInt, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierType } from '../../domains/enum/courier-type.enum';

export class CalculateShippingDto {
  @ApiProperty({ example: '501', description: 'ID kota asal (dari hasil search cities)' })
  @IsString()
  originCityId: string = '501';

  @ApiProperty({ example: '151', description: 'ID kota tujuan' })
  @IsString()
  destinationCityId: string = '151';

  @ApiProperty({ example: 1500, description: 'Berat paket dalam gram' })
  @IsInt()
  @Min(100)
  @Max(30000)
  weightGrams: number = 1500;

  @ApiPropertyOptional({
    enum: CourierType,
    isArray: true,
    description: 'Filter kurir tertentu. Kosong = semua kurir',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CourierType, { each: true })
  couriers?: CourierType[];
}