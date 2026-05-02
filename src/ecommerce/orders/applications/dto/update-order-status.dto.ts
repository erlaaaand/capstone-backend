import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../domains/enum/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `Status tidak valid. Pilih salah satu: ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsNotEmpty()
  status: OrderStatus = OrderStatus.PENDING_PAYMENT;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Nomor resi maksimal 255 karakter.' })
  trackingNumber?: string;
}