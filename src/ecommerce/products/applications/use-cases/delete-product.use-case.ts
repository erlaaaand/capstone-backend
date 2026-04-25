import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.productRepository.existsById(id);
    if (!exists) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan.`);
    }
    await this.productRepository.delete(id);
  }
}