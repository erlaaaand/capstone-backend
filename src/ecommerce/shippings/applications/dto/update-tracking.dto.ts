import { IsEnum, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';

export class UpdateTrackingDto {
  @ApiProperty({ enum: ShippingStatus, description: 'Status pengiriman baru' })
  @IsEnum(ShippingStatus)
  status: ShippingStatus = ShippingStatus.IN_TRANSIT;

  @ApiProperty({ example: 'Paket sedang dalam pengiriman menuju kota tujuan' })
  @IsString()
  @MinLength(5)
  description: string = '';

  @ApiPropertyOptional({ example: 'Hub Surabaya' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'JNE123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}