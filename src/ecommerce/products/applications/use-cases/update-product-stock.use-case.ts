import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateStockDto, StockAction } from '../dto/update-stock.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductMapper } from '../../domains/mappers/product.mapper';

@Injectable()
export class UpdateProductStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, dto: UpdateStockDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan.`);
    }

    try {
      if (dto.action === StockAction.DECREASE) {
        product.decreaseStock(dto.quantity);
      } else {
        product.increaseStock(dto.quantity);
      }
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const updated = await this.productRepository.update(id, {
      stock: product.stock,
      status: product.status,
    });

    return ProductMapper.toResponse(updated);
  }
}