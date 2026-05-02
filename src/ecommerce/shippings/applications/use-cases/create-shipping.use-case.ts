import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { CreateShippingDto } from '../dto/create-shipping.dto';
import { ShippingResponseDto } from '../dto/shipping-response.dto';
import { type IShippingRepository } from '../../infrastructures/repositories/shipping.repository.interface';
import { ShippingDomainService } from '../../domains/services/shipping-domain.service';
import { ShippingMapper } from '../../domains/mappers/shipping.mapper';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';
import { SHIPPING_CONSTANTS } from '../../domains/constants/shipping.constants';

@Injectable()
export class CreateShippingUseCase {
  constructor(
    @Inject(SHIPPING_CONSTANTS.REPOSITORY_TOKEN)
    private readonly shippingRepo: IShippingRepository,
    private readonly shippingDomainService: ShippingDomainService,
  ) {}

  async execute(dto: CreateShippingDto): Promise<ShippingResponseDto> {
    // Prevent duplicate shipping for same order
    const existing = await this.shippingRepo.findByOrderId(dto.orderId);
    if (existing) {
      throw new ConflictException(`Shipping for order ${dto.orderId} already exists`);
    }

    const trackingNumber = this.shippingDomainService.generateTrackingNumber(dto.courier);
    const estimatedDays = 3; // Will be overridden by actual data in production
    const estimatedDelivery = this.shippingDomainService.calculateEstimatedDelivery(estimatedDays);

    const insuranceCost =
      dto.withInsurance && dto.itemValue
        ? this.shippingDomainService.calculateInsurance(dto.itemValue)
        : 0;

    const initialHistory = this.shippingDomainService.addTrackingHistory(
      { trackingHistory: [] } as any,
      ShippingStatus.PENDING,
      'Pesanan pengiriman dibuat, menunggu diproses',
      dto.originCityName,
    );

    const shipping = await this.shippingRepo.save({
      orderId: dto.orderId,
      trackingNumber,
      courier: dto.courier,
      courierService: dto.courierService,
      status: ShippingStatus.PENDING,
      originCityId: dto.originCityId,
      originCityName: dto.originCityName,
      destinationCityId: dto.destinationCityId,
      destinationCityName: dto.destinationCityName,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      recipientAddress: dto.recipientAddress,
      weightGrams: dto.weightGrams,
      shippingCost: dto.shippingCost,
      insuranceCost,
      estimatedDays,
      estimatedDelivery,
      trackingHistory: initialHistory,
      notes: dto.notes,
    });

    return ShippingMapper.toResponseDto(shipping);
  }
}