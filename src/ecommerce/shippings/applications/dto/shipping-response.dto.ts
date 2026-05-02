import { CourierType } from '../../domains/enum/courier-type.enum';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';
import { TrackingHistory } from '../../domains/entities/shipping.entity';

export class ShippingResponseDto {
  id: string = '';
  orderId: string = '';
  trackingNumber: string = '';
  courier: CourierType = CourierType.JNE;
  courierService: string = '';
  status: ShippingStatus = ShippingStatus.IN_TRANSIT;

  origin: {cityId: string; cityName: string } = {
    cityId: '',
    cityName: ''
  };

  destination: {cityId: string; cityName: string } = {
    cityId: '',
    cityName: ''
  };

  recipient: {name: string; phone: string; address: string } = {
    name: '',
    phone: '',
    address: ''
  };

  weightGrams: number = 0;
  shippingCost: number = 0;
  insuranceCost: number = 0;
  totalCost: number = 0;
  estimatedDays: number = 0;
  estimatedDelivery: Date = new Date();
  actualDelivery: Date = new Date();
  trackingHistory: TrackingHistory[] = [];
  notes: string = '';
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

export class CalculateShippingResponseDto {
  courier: CourierType = CourierType.JNE;
  service: string = '';
  serviceDescription: string = '';
  cost: number = 0;
  estimatedDays: string = ''; // e.g. "2-3 hari"
}

export class CityResponseDto {
  cityId: string = '';
  cityName: string = '';
  provinceName: string = '';
  postalCode: string = '';
}

export class PaginatedShippingResponseDto {
  data: ShippingResponseDto[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 10;
  totalPages: number = 1;
}