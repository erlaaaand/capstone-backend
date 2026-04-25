import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../infrastructures/repositories/product.repository.interface';
import { ProductDomainService } from '../../domains/services/product-domain.service';
import { ProductMapper } from '../../domains/mappers/product.mapper';
import { ProductResponseDto } from '../dto/product-response.dto';

export interface VerifyAiCertificateInput {
  productId: string;
  predictionId: string;
  aiPredictedClass: string;
}

@Injectable()
export class VerifyAiCertificateUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(input: VerifyAiCertificateInput): Promise<ProductResponseDto> {
    const { productId, predictionId, aiPredictedClass } = input;

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${productId}" tidak ditemukan.`);
    }

    try {
      this.productDomainService.validateAiPredictionMatch(product.variety, aiPredictedClass);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // Simpan predictionId dan jadikan produk AVAILABLE
    try {
      product.predictionId = predictionId;
      product.markAsAvailable();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const updated = await this.productRepository.update(productId, {
      predictionId: product.predictionId,
      status: product.status,
    });

    return ProductMapper.toResponse(updated);
  }
}
