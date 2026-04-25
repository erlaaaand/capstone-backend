import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductMapper } from '../../domains/mappers/product.mapper';
import { ProductValidator } from '../../domains/validators/product.validator';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan.`);
    }

    // Validasi dengan data yang akan di-merge
    try {
      ProductValidator.validateForCreation({
        price: dto.price ?? existing.price,
        stock: dto.stock ?? existing.stock,
        weightInGrams: dto.weightInGrams ?? existing.weightInGrams,
        status: dto.status ?? existing.status,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const updated = await this.productRepository.update(id, {
      ...dto,
    });

    return ProductMapper.toResponse(updated);
  }
}