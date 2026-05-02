import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { OrderStatus } from '../../domains/enum/order-status.enum';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama penerima wajib diisi.' })
  @MaxLength(255)
  recipientName: string = '';

  @IsString()
  @IsNotEmpty({ message: 'Alamat pengiriman wajib diisi.' })
  shippingAddress: string = '';

  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon penerima wajib diisi.' })
  @MaxLength(20)
  @Matches(/^[0-9+\-() ]{7,20}$/, { message: 'Format nomor telepon tidak valid.' })
  recipientPhone: string = '';

  @IsString()
  @IsOptional()
  notes?: string;
}