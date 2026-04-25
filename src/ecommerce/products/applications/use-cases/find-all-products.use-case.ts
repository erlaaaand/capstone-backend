import { Inject, Injectable } from '@nestjs/common';
import { ProductQueryDto } from '../dto/product-query.dto';
import { PaginatedProductResponseDto } from '../dto/paginated-product-response.dto';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductMapper } from '../../domains/mappers/product.mapper';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: ProductQueryDto): Promise<PaginatedProductResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.productRepository.findAll(query);

    const totalPages = Math.ceil(total / limit);

    return {
      data: ProductMapper.toResponseList(data),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}