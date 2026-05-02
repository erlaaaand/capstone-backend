import { ShippingEntity } from '../entities/shipping.entity';
import { ShippingResponseDto } from '../../applications/dto/shipping-response.dto';

export class ShippingMapper {
  static toResponseDto(entity: ShippingEntity): ShippingResponseDto {
    return {
      id: entity.id,
      orderId: entity.orderId,
      trackingNumber: entity.trackingNumber,
      courier: entity.courier,
      courierService: entity.courierService,
      status: entity.status,
      origin: {
        cityId: entity.originCityId,
        cityName: entity.originCityName,
      },
      destination: {
        cityId: entity.destinationCityId,
        cityName: entity.destinationCityName,
      },
      recipient: {
        name: entity.recipientName,
        phone: entity.recipientPhone,
        address: entity.recipientAddress,
      },
      weightGrams: entity.weightGrams,
      shippingCost: entity.shippingCost,
      insuranceCost: entity.insuranceCost,
      totalCost: entity.shippingCost + entity.insuranceCost,
      estimatedDays: entity.estimatedDays,
      estimatedDelivery: entity.estimatedDelivery,
      actualDelivery: entity.actualDelivery,
      trackingHistory: entity.trackingHistory ?? [],
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseDtoList(entities: ShippingEntity[]): ShippingResponseDto[] {
    return entities.map((e) => this.toResponseDto(e));
  }
}