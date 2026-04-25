import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductOrchestrator } from '../../applications/orchestrator/product.orchestrator';
import { ProductQueryDto } from '../../applications/dto/product-query.dto';
import { ProductExceptionFilter } from '../filters/product-exception.filter';

@Controller('products')
@UseFilters(ProductExceptionFilter)
export class ProductPublicController {
  constructor(private readonly orchestrator: ProductOrchestrator) {}

  /**
   * GET /products
   * Mengambil daftar produk yang tersedia untuk publik (hanya status AVAILABLE)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ProductQueryDto) {
    // Publik hanya melihat produk AVAILABLE
    const publicQuery: ProductQueryDto = {
      ...query,
      status: query.status ?? undefined,
    };
    const result = await this.orchestrator.findAllProducts(publicQuery);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /products/:id
   * Mengambil detail satu produk berdasarkan ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const product = await this.orchestrator.findProductById(id);
    return {
      success: true,
      data: product,
    };
  }
}