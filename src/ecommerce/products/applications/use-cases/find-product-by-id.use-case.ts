import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductResponseDto } from '../dto/product-response.dto';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductMapper } from '../../domains/mappers/product.mapper';

@Injectable()
export class FindProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan.`);
    }

    return ProductMapper.toResponse(product);
  }
}