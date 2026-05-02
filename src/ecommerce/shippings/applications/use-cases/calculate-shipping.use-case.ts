import { Inject, Injectable } from '@nestjs/common';
import { CalculateShippingDto } from '../dto/calculate-shipping.dto';
import { CalculateShippingResponseDto } from '../dto/shipping-response.dto';
import { type IShippingProvider } from '../../infrastructures/adapters/shipping-provider.interface';
import { ShippingValidator } from '../../domains/validators/shipping.validator';
import { SHIPPING_CONSTANTS } from '../../domains/constants/shipping.constants';

@Injectable()
export class CalculateShippingUseCase {
  constructor(
    @Inject(SHIPPING_CONSTANTS.PROVIDER_TOKEN)
    private readonly shippingProvider: IShippingProvider,
  ) {}

  async execute(dto: CalculateShippingDto): Promise<CalculateShippingResponseDto[]> {
    ShippingValidator.validateCalculateInput(
      dto.originCityId,
      dto.destinationCityId,
      dto.weightGrams,
    );

    const results = await this.shippingProvider.calculateCosts(
      dto.originCityId,
      dto.destinationCityId,
      dto.weightGrams,
      dto.couriers,
    );

    return results.map((r) => ({
      courier: r.courier,
      service: r.service,
      serviceDescription: r.serviceDescription,
      cost: r.cost,
      estimatedDays:
        r.estimatedDays === 0
          ? 'Same Day'
          : r.estimatedDays === 1
          ? '1 hari'
          : `${r.estimatedDays} hari`,
    }));
  }
}