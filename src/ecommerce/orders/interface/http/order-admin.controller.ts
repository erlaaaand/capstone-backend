import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseFilters,
} from '@nestjs/common';
import { OrderOrchestrator } from '../../applications/orchestrator/order.orchestrator';
import { UpdateOrderStatusDto } from '../../applications/dto/update-order-status.dto';
import { OrderExceptionFilter } from '../filters/order-exception.filter';
import { OrderStatus } from '../../domains/enum/order-status.enum';
import { OrderDomainService } from '../../domains/services/order-domain.service';
import { FindOrderByIdUseCase } from '../../applications/use-cases/find-order-by-id.use-case';

@Controller('admin/orders')
@UseFilters(OrderExceptionFilter)
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
export class OrderAdminController {
  constructor(
    private readonly orchestrator: OrderOrchestrator,
    private readonly orderDomainService: OrderDomainService,
  ) {}

  /**
   * GET /admin/orders
   * Semua order dari seluruh user — untuk dasbor admin.
   * Query params: page, limit, status
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    const result = await this.orchestrator.findUserOrders(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status,
      },
      // userId tidak dikirim → ambil semua order (admin mode)
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /admin/orders/:id
   * Detail order tanpa ownership restriction
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOrderById(@Param('id', new ParseUUIDPipe()) id: string) {
    const order = await this.orchestrator.findOrderById(id);
    return {
      success: true,
      data: order,
    };
  }

  /**
   * PATCH /admin/orders/:id/status
   * Transisi status order melalui state machine.
   *
   * Alur transisi yang valid:
   *   PENDING_PAYMENT → PROCESSING  (konfirmasi pembayaran)
   *   PROCESSING      → SHIPPED     (wajib sertakan trackingNumber)
   *   SHIPPED         → DELIVERED
   *   DELIVERED       → COMPLETED
   *   PENDING_PAYMENT → CANCELLED
   *   PROCESSING      → CANCELLED   (otomatis tandai REFUNDED jika sudah PAID)
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.orchestrator.updateOrderStatus(id, dto);

    const allowedNext = this.orderDomainService.getAllowedNextStatuses(order.status as OrderStatus);

    return {
      success: true,
      message: `Status order berhasil diperbarui menjadi "${order.status}".`,
      data: order,
      meta: {
        allowedNextStatuses: allowedNext,
      },
    };
  }
}