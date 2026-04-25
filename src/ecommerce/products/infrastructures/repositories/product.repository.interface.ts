import { ProductEntity } from '../../domains/entities/product.entity';
import { ProductQueryDto } from '../../applications/dto/product-query.dto';

export interface IProductRepository {
  create(product: Partial<ProductEntity>): Promise<ProductEntity>;
  findById(id: string): Promise<ProductEntity | null>;
  findAll(query: ProductQueryDto): Promise<{ data: ProductEntity[]; total: number }>;
  update(id: string, product: Partial<ProductEntity>): Promise<ProductEntity>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'IProductRepository';