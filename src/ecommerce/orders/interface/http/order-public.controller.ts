import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import { Request } from 'express';
import { OrderOrchestrator } from '../../applications/orchestrator/order.orchestrator';
import { CreateOrderDto } from '../../applications/dto/create-order.dto';
import { OrderExceptionFilter } from '../filters/order-exception.filter';
import { OrderStatus } from '../../domains/enum/order-status.enum';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Controller('orders')
@UseFilters(OrderExceptionFilter)
// @UseGuards(JwtAuthGuard)  ← Uncomment setelah auth module siap
export class OrderPublicController {
  constructor(private readonly orchestrator: OrderOrchestrator) {}

  /**
   * POST /orders
   * Checkout: membuat order dari keranjang aktif user.
   * Stok otomatis dikurangi & keranjang dikosongkan.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const order = await this.orchestrator.createOrder(userId, dto);
    return {
      success: true,
      message: 'Order berhasil dibuat. Silakan lakukan pembayaran.',
      data: order,
    };
  }

  /**
   * GET /orders
   * Riwayat order milik user yang sedang login.
   * Query params: page, limit, status
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findMyOrders(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const result = await this.orchestrator.findUserOrders(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status,
      },
      userId,
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /orders/:id
   * Detail order — hanya milik user sendiri yang boleh diakses.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOrderById(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const userId = req.user?.id ?? 'mock-user-id';
    const order = await this.orchestrator.findOrderById(id, userId);
    return {
      success: true,
      data: order,
    };
  }
}