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
  Req,
  UseFilters,
} from '@nestjs/common';
import { Request } from 'express';
import { CartOrchestrator } from '../../applications/orchestrator/cart.orchestrator';
import { AddToCartDto } from '../../applications/dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../../applications/dto/update-cart-item.dto';
import { CartExceptionFilter } from '../filters/cart-exception.filter';

// Ganti dengan interface dari JWT strategy project Anda
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Controller('cart')
@UseFilters(CartExceptionFilter)
// @UseGuards(JwtAuthGuard)   ← Uncomment setelah auth module siap
export class CartController {
  constructor(private readonly orchestrator: CartOrchestrator) {}

  /**
   * GET /cart
   * Melihat isi keranjang milik user yang sedang login.
   * Jika belum ada keranjang, akan dibuat otomatis.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async viewCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id ?? 'mock-user-id'; // Ganti dengan user dari JWT
    const cart = await this.orchestrator.viewCart(userId);
    return {
      success: true,
      data: cart,
    };
  }

  /**
   * POST /cart/items
   * Menambahkan produk ke keranjang.
   * Jika produk sudah ada, quantity akan ditambahkan.
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addToCart(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddToCartDto,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const cart = await this.orchestrator.addToCart(userId, dto);
    return {
      success: true,
      message: 'Produk berhasil ditambahkan ke keranjang.',
      data: cart,
    };
  }

  /**
   * PATCH /cart/items/:productId
   * Mengubah quantity suatu item di keranjang.
   */
  @Patch('items/:productId')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const cart = await this.orchestrator.updateCartItem(userId, productId, dto);
    return {
      success: true,
      message: 'Jumlah item berhasil diperbarui.',
      data: cart,
    };
  }

  /**
   * DELETE /cart/items/:productId
   * Menghapus satu item dari keranjang.
   */
  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  async removeFromCart(
    @Req() req: AuthenticatedRequest,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const cart = await this.orchestrator.removeFromCart(userId, productId);
    return {
      success: true,
      message: 'Item berhasil dihapus dari keranjang.',
      data: cart,
    };
  }

  /**
   * DELETE /cart
   * Mengosongkan seluruh isi keranjang.
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id ?? 'mock-user-id';
    const cart = await this.orchestrator.clearCart(userId);
    return {
      success: true,
      message: 'Keranjang berhasil dikosongkan.',
      data: cart,
    };
  }
}