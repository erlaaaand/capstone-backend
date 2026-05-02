import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierType } from '../../domains/enum/courier-type.enum';

export class CreateShippingDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  orderId: string = '';

  @ApiProperty({ enum: CourierType, example: CourierType.JNE })
  @IsEnum(CourierType)
  courier: CourierType = CourierType.JNE;

  @ApiProperty({ example: 'REG', description: 'Kode layanan kurir (REG, YES, OKE, dll)' })
  @IsString()
  courierService: string = '';

  @ApiProperty({ example: '501' })
  @IsString()
  originCityId: string = '';

  @ApiProperty({ example: 'Surabaya' })
  @IsString()
  originCityName: string = '';

  @ApiProperty({ example: '151' })
  @IsString()
  destinationCityId: string = '';

  @ApiProperty({ example: 'Jakarta Pusat' })
  @IsString()
  destinationCityName: string = '';

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @MinLength(2)
  recipientName: string = '';

  @ApiProperty({ example: '081234567890' })
  @IsString()
  recipientPhone: string = '';

  @ApiProperty({ example: 'Jl. Merdeka No. 1, RT 01/02, Kel. Gambir' })
  @IsString()
  recipientAddress: string = '';

  @ApiProperty({ example: 1500, description: 'Berat dalam gram' })
  @IsInt()
  @Min(100)
  @Max(30000)
  weightGrams: number = 1500;

  @ApiProperty({ example: 15000, description: 'Ongkir yang sudah dikalkulasi (dari calculate)' })
  @IsInt()
  @Min(0)
  shippingCost: number = 15000;

  @ApiPropertyOptional({ example: true, description: 'Apakah menggunakan asuransi?' })
  @IsOptional()
  @IsBoolean()
  withInsurance?: boolean;

  @ApiPropertyOptional({ example: 200000, description: 'Nilai barang untuk perhitungan asuransi' })
  @IsOptional()
  @IsInt()
  itemValue?: number;

  @ApiPropertyOptional({ example: 'Handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;
}