import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductOrchestrator } from '../../applications/orchestrator/product.orchestrator';
import { CreateProductDto } from '../../applications/dto/create-product.dto';
import { UpdateProductDto } from '../../applications/dto/update-product.dto';
import { UpdateStockDto } from '../../applications/dto/update-stock.dto';
import { ProductQueryDto } from '../../applications/dto/product-query.dto';
import { ProductExceptionFilter } from '../filters/product-exception.filter';

// Interface sementara; ganti dengan decorator JWT guard sesuai auth module project
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Controller('admin/products')
@UseFilters(ProductExceptionFilter)
// @UseGuards(JwtAuthGuard, RolesGuard)   ← Uncomment dan tambahkan guard autentikasi Anda
// @Roles('ADMIN', 'SELLER')
export class ProductAdminController {
  constructor(private readonly orchestrator: ProductOrchestrator) {}

  /**
   * POST /admin/products
   * Membuat produk baru
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    const createdById = req.user?.id ?? 'system'; // Ganti dengan user dari JWT
    const product = await this.orchestrator.createProduct(dto, createdById);
    return {
      success: true,
      message: 'Produk berhasil dibuat.',
      data: product,
    };
  }

  /**
   * GET /admin/products
   * Mengambil semua produk (semua status, untuk manajemen)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.orchestrator.findAllProducts(query);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /admin/products/:id
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

  /**
   * PUT /admin/products/:id
   * Update data produk secara penuh/sebagian
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.orchestrator.updateProduct(id, dto);
    return {
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: product,
    };
  }

  /**
   * PATCH /admin/products/:id/stock
   * Update stok produk (increase / decrease)
   */
  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  async updateStock(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    const product = await this.orchestrator.updateProductStock(id, dto);
    return {
      success: true,
      message: `Stok berhasil di-${dto.action.toLowerCase()} sebesar ${dto.quantity}.`,
      data: product,
    };
  }

  /**
   * PATCH /admin/products/:id/verify-ai
   * Verifikasi sertifikat AI untuk sebuah produk
   */
  @Patch(':id/verify-ai')
  @HttpCode(HttpStatus.OK)
  async verifyAi(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { predictionId: string; aiPredictedClass: string },
  ) {
    const product = await this.orchestrator.verifyAiCertificate({
      productId: id,
      predictionId: body.predictionId,
      aiPredictedClass: body.aiPredictedClass,
    });
    return {
      success: true,
      message: 'Verifikasi AI berhasil. Produk kini berstatus AVAILABLE.',
      data: product,
    };
  }

  /**
   * DELETE /admin/products/:id
   * Menghapus produk
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.orchestrator.deleteProduct(id);
    return {
      success: true,
      message: 'Produk berhasil dihapus.',
    };
  }
}