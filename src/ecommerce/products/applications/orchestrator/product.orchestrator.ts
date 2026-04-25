import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { PaginatedProductResponseDto } from '../dto/paginated-product-response.dto';
import { CreateProductUseCase } from '../use-cases/create-product.use-case';
import { FindAllProductsUseCase } from '../use-cases/find-all-products.use-case';
import { FindProductByIdUseCase } from '../use-cases/find-product-by-id.use-case';
import { UpdateProductUseCase } from '../use-cases/update-product.use-case';
import { UpdateProductStockUseCase } from '../use-cases/update-product-stock.use-case';
import { DeleteProductUseCase } from '../use-cases/delete-product.use-case';
import { VerifyAiCertificateUseCase, VerifyAiCertificateInput } from '../use-cases/verify-ai-certificate.use-case';

@Injectable()
export class ProductOrchestrator {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateProductStockUseCase: UpdateProductStockUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly verifyAiCertificateUseCase: VerifyAiCertificateUseCase,
  ) {}

  async createProduct(dto: CreateProductDto, createdById: string): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(dto, createdById);
  }

  async findAllProducts(query: ProductQueryDto): Promise<PaginatedProductResponseDto> {
    return this.findAllProductsUseCase.execute(query);
  }

  async findProductById(id: string): Promise<ProductResponseDto> {
    return this.findProductByIdUseCase.execute(id);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    return this.updateProductUseCase.execute(id, dto);
  }

  async updateProductStock(id: string, dto: UpdateStockDto): Promise<ProductResponseDto> {
    return this.updateProductStockUseCase.execute(id, dto);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.deleteProductUseCase.execute(id);
  }

  async verifyAiCertificate(input: VerifyAiCertificateInput): Promise<ProductResponseDto> {
    return this.verifyAiCertificateUseCase.execute(input);
  }
}
