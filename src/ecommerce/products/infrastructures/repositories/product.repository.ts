import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductEntity } from '../../domains/entities/product.entity';
import { ProductQueryDto } from '../../applications/dto/product-query.dto';
import { IProductRepository } from './product.repository.interface';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly ormRepo: Repository<ProductEntity>,
  ) {}

  async create(product: Partial<ProductEntity>): Promise<ProductEntity> {
    const entity = this.ormRepo.create(product);
    return this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<ProductEntity | null> {
    return this.ormRepo.findOne({ where: { id } });
  }

  async findAll(query: ProductQueryDto): Promise<{ data: ProductEntity[]; total: number }> {
    const { page = 1, limit = 10, search, variety, status, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const qb: SelectQueryBuilder<ProductEntity> = this.ormRepo.createQueryBuilder('product');

    if (search) {
      qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (variety) {
      qb.andWhere('product.variety = :variety', { variety });
    }

    if (status) {
      qb.andWhere('product.status = :status', { status });
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'price', 'stock', 'name'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    qb.orderBy(`product.${safeSortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async update(id: string, product: Partial<ProductEntity>): Promise<ProductEntity> {
    await this.ormRepo.update(id, product);
    return this.ormRepo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.ormRepo.count({ where: { id } });
    return count > 0;
  }
}