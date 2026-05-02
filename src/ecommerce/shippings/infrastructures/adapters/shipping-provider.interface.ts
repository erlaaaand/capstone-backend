import { CourierType } from '../../domains/enum/courier-type.enum';

export interface ShippingCostResult {
  courier: CourierType;
  service: string;
  serviceDescription: string;
  cost: number;
  estimatedDays: number;
}

export interface CityResult {
  cityId: string;
  cityName: string;
  provinceName: string;
  postalCode: string;
}

export interface IShippingProvider {
  /**
   * Search cities by name keyword
   */
  searchCities(keyword: string): Promise<CityResult[]>;

  /**
   * Get available shipping costs for given route & weight
   */
  calculateCosts(
    originCityId: string,
    destinationCityId: string,
    weightGrams: number,
    couriers?: CourierType[],
  ): Promise<ShippingCostResult[]>;

  /**
   * Track a shipment by tracking number and courier
   */
  trackShipment(
    trackingNumber: string,
    courier: CourierType,
  ): Promise<{ status: string; history: Array<{ description: string; timestamp: Date; location?: string }> }>;
}