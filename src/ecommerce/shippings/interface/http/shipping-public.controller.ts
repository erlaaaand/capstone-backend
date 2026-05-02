import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ShippingOrchestrator } from '../../applications/orchestrator/shipping.orchestrator';
import { CalculateShippingDto } from '../../applications/dto/calculate-shipping.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

@ApiTags('Shipping - Public')
@UseFilters(ShippingExceptionFilter)
@Controller('shippings')
export class ShippingPublicController {
  constructor(private readonly orchestrator: ShippingOrchestrator) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Kalkulasi ongkir dari berbagai kurir' })
  async calculateShipping(@Body() dto: CalculateShippingDto) {
    const results = await this.orchestrator.calculateShipping(dto);
    return { success: true, data: results };
  }

  @Get('cities')
  @ApiOperation({ summary: 'Cari kota berdasarkan keyword' })
  @ApiQuery({ name: 'keyword', required: true, type: String })
  async searchCities(@Query('keyword') keyword: string) {
    const cities = await this.orchestrator.searchCities(keyword);
    return { success: true, data: cities };
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Lacak pengiriman berdasarkan nomor resi' })
  async trackByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    const result = await this.orchestrator.trackByTrackingNumber(trackingNumber);
    return { success: true, data: result };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lacak pengiriman berdasarkan ID order' })
  async trackByOrderId(@Param('orderId') orderId: string) {
    const result = await this.orchestrator.trackByOrderId(orderId);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengiriman berdasarkan ID' })
  async getById(@Param('id') id: string) {
    const result = await this.orchestrator.trackById(id);
    return { success: true, data: result };
  }
}