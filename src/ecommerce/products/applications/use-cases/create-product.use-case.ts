import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductValidator } from '../../domains/validators/product.validator';
import { ProductMapper } from '../../domains/mappers/product.mapper';
import { ProductCreatedEvent } from '../../infrastructures/events/product-created.event';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateProductDto, createdById: string): Promise<ProductResponseDto> {
    try {
      ProductValidator.validateForCreation({
        price: dto.price,
        stock: dto.stock,
        weightInGrams: dto.weightInGrams,
        status: dto.status,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      variety: dto.variety,
      price: dto.price,
      stock: dto.stock,
      weightInGrams: dto.weightInGrams,
      imageUrl: dto.imageUrl ?? null,
      status: dto.status,
      predictionId: dto.predictionId ?? null,
      createdById,
    });

    this.eventEmitter.emit(
      'product.created',
      new ProductCreatedEvent(product.id, product.name, product.variety, product.createdById, product.createdAt),
    );

    return ProductMapper.toResponse(product);
  }
}
