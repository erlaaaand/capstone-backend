import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateTrackingDto } from '../dto/update-tracking.dto';
import { ShippingResponseDto } from '../dto/shipping-response.dto';
import { type IShippingRepository } from '../../infrastructures/repositories/shipping.repository.interface';
import { ShippingDomainService } from '../../domains/services/shipping-domain.service';
import { ShippingMapper } from '../../domains/mappers/shipping.mapper';
import { SHIPPING_CONSTANTS, SHIPPING_ERRORS } from '../../domains/constants/shipping.constants';

@Injectable()
export class UpdateTrackingUseCase {
  constructor(
    @Inject(SHIPPING_CONSTANTS.REPOSITORY_TOKEN)
    private readonly shippingRepo: IShippingRepository,
    private readonly shippingDomainService: ShippingDomainService,
  ) {}

  async execute(id: string, dto: UpdateTrackingDto): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepo.findById(id);
    if (!shipping) throw new NotFoundException(SHIPPING_ERRORS.NOT_FOUND);

    // Validate and apply status transition
    const updated = this.shippingDomainService.transitionStatus(
      shipping,
      dto.status,
      dto.description,
      dto.location,
    );

    // Optionally update tracking number if provided (e.g., courier assigns it)
    if (dto.trackingNumber) {
      updated.trackingNumber = dto.trackingNumber;
    }

    const saved = await this.shippingRepo.update(id, updated);
    return ShippingMapper.toResponseDto(saved);
  }
}