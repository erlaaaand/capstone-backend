import { Injectable } from '@nestjs/common';
import { CalculateShippingUseCase } from '../use-cases/calculate-shipping.use-case';
import { CreateShippingUseCase } from '../use-cases/create-shipping.use-case';
import { TrackShippingUseCase } from '../use-cases/track-shipping.use-case';
import { UpdateTrackingUseCase } from '../use-cases/update-tracking.use-case';
import { CalculateShippingDto } from '../dto/calculate-shipping.dto';
import { CreateShippingDto } from '../dto/create-shipping.dto';
import { UpdateTrackingDto } from '../dto/update-tracking.dto';
import {
  CalculateShippingResponseDto,
  CityResponseDto,
  PaginatedShippingResponseDto,
  ShippingResponseDto,
} from '../dto/shipping-response.dto';
import { type IShippingProvider } from '../../infrastructures/adapters/shipping-provider.interface';
import { type IShippingRepository } from '../../infrastructures/repositories/shipping.repository.interface';
import { Inject } from '@nestjs/common';
import { SHIPPING_CONSTANTS } from '../../domains/constants/shipping.constants';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';
import { ShippingMapper } from '../../domains/mappers/shipping.mapper';

@Injectable()
export class ShippingOrchestrator {
  constructor(
    private readonly calculateUseCase: CalculateShippingUseCase,
    private readonly createUseCase: CreateShippingUseCase,
    private readonly trackUseCase: TrackShippingUseCase,
    private readonly updateTrackingUseCase: UpdateTrackingUseCase,
    @Inject(SHIPPING_CONSTANTS.PROVIDER_TOKEN)
    private readonly shippingProvider: IShippingProvider,
    @Inject(SHIPPING_CONSTANTS.REPOSITORY_TOKEN)
    private readonly shippingRepo: IShippingRepository,
  ) {}

  async calculateShipping(dto: CalculateShippingDto): Promise<CalculateShippingResponseDto[]> {
    return this.calculateUseCase.execute(dto);
  }

  async searchCities(keyword: string): Promise<CityResponseDto[]> {
    return this.shippingProvider.searchCities(keyword);
  }

  async createShipping(dto: CreateShippingDto): Promise<ShippingResponseDto> {
    return this.createUseCase.execute(dto);
  }

  async trackById(id: string): Promise<ShippingResponseDto> {
    return this.trackUseCase.executeById(id);
  }

  async trackByTrackingNumber(trackingNumber: string): Promise<ShippingResponseDto> {
    return this.trackUseCase.executeByTrackingNumber(trackingNumber);
  }

  async trackByOrderId(orderId: string): Promise<ShippingResponseDto> {
    return this.trackUseCase.executeByOrderId(orderId);
  }

  async updateTracking(id: string, dto: UpdateTrackingDto): Promise<ShippingResponseDto> {
    return this.updateTrackingUseCase.execute(id, dto);
  }

  async getAllShippings(options?: {
    status?: ShippingStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedShippingResponseDto> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const { data, total } = await this.shippingRepo.findAll({ ...options, page, limit });

    return {
      data: ShippingMapper.toResponseDtoList(data),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelShipping(id: string): Promise<ShippingResponseDto> {
    const dto: UpdateTrackingDto = {
      status: ShippingStatus.CANCELLED,
      description: 'Pengiriman dibatalkan',
    };
    return this.updateTrackingUseCase.execute(id, dto);
  }
}