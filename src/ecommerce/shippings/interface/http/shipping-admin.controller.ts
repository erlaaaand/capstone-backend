import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ShippingOrchestrator } from '../../applications/orchestrator/shipping.orchestrator';
import { CreateShippingDto } from '../../applications/dto/create-shipping.dto';
import { UpdateTrackingDto } from '../../applications/dto/update-tracking.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';

@ApiTags('Shipping - Admin')
@UseFilters(ShippingExceptionFilter)
// @UseGuards(JwtAuthGuard, RolesGuard)   ← uncomment when auth is ready
// @Roles('admin')
@Controller('admin/shippings')
export class ShippingAdminController {
  constructor(private readonly orchestrator: ShippingOrchestrator) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Buat data pengiriman baru' })
  async createShipping(@Body() dto: CreateShippingDto) {
    const result = await this.orchestrator.createShipping(dto);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Ambil semua data pengiriman dengan paginasi' })
  @ApiQuery({ name: 'status', enum: ShippingStatus, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAllShippings(
    @Query('status') status?: ShippingStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.orchestrator.getAllShippings({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
    return { success: true, ...result };
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: '[Admin] Update status dan histori tracking pengiriman' })
  async updateTracking(
    @Param('id') id: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    const result = await this.orchestrator.updateTracking(id, dto);
    return { success: true, data: result };
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: '[Admin] Batalkan pengiriman' })
  async cancelShipping(@Param('id') id: string) {
    const result = await this.orchestrator.cancelShipping(id);
    return { success: true, data: result };
  }
}