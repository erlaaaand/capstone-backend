import { ProductResponseDto } from './product-response.dto';

export class PaginatedProductResponseDto {
  data!: ProductResponseDto[];
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}