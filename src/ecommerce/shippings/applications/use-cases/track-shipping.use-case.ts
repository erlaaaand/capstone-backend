import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ShippingResponseDto } from '../dto/shipping-response.dto';
import { type IShippingRepository } from '../../infrastructures/repositories/shipping.repository.interface';
import { ShippingMapper } from '../../domains/mappers/shipping.mapper';
import { SHIPPING_CONSTANTS, SHIPPING_ERRORS } from '../../domains/constants/shipping.constants';

@Injectable()
export class TrackShippingUseCase {
  constructor(
    @Inject(SHIPPING_CONSTANTS.REPOSITORY_TOKEN)
    private readonly shippingRepo: IShippingRepository,
  ) {}

  async executeById(id: string): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepo.findById(id);
    if (!shipping) throw new NotFoundException(SHIPPING_ERRORS.NOT_FOUND);
    return ShippingMapper.toResponseDto(shipping);
  }

  async executeByTrackingNumber(trackingNumber: string): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepo.findByTrackingNumber(trackingNumber);
    if (!shipping) throw new NotFoundException(SHIPPING_ERRORS.NOT_FOUND);
    return ShippingMapper.toResponseDto(shipping);
  }

  async executeByOrderId(orderId: string): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepo.findByOrderId(orderId);
    if (!shipping) throw new NotFoundException(SHIPPING_ERRORS.NOT_FOUND);
    return ShippingMapper.toResponseDto(shipping);
  }
}