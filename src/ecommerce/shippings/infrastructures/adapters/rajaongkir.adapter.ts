import { Injectable, Logger } from '@nestjs/common';
import { CourierType } from '../../domains/enum/courier-type.enum';
import {
  CityResult,
  IShippingProvider,
  ShippingCostResult,
} from './shipping-provider.interface';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CITIES: CityResult[] = [
  { cityId: '501', cityName: 'Surabaya', provinceName: 'Jawa Timur', postalCode: '60111' },
  { cityId: '151', cityName: 'Jakarta Pusat', provinceName: 'DKI Jakarta', postalCode: '10000' },
  { cityId: '152', cityName: 'Jakarta Selatan', provinceName: 'DKI Jakarta', postalCode: '12110' },
  { cityId: '153', cityName: 'Jakarta Utara', provinceName: 'DKI Jakarta', postalCode: '14000' },
  { cityId: '154', cityName: 'Jakarta Barat', provinceName: 'DKI Jakarta', postalCode: '11220' },
  { cityId: '155', cityName: 'Jakarta Timur', provinceName: 'DKI Jakarta', postalCode: '13000' },
  { cityId: '114', cityName: 'Bandung', provinceName: 'Jawa Barat', postalCode: '40111' },
  { cityId: '399', cityName: 'Medan', provinceName: 'Sumatera Utara', postalCode: '20111' },
  { cityId: '291', cityName: 'Makassar', provinceName: 'Sulawesi Selatan', postalCode: '90111' },
  { cityId: '23', cityName: 'Bali', provinceName: 'Bali', postalCode: '80111' },
  { cityId: '444', cityName: 'Padang', provinceName: 'Sumatera Barat', postalCode: '25111' },
  { cityId: '131', cityName: 'Yogyakarta', provinceName: 'DI Yogyakarta', postalCode: '55111' },
  { cityId: '56', cityName: 'Semarang', provinceName: 'Jawa Tengah', postalCode: '50111' },
  { cityId: '255', cityName: 'Malang', provinceName: 'Jawa Timur', postalCode: '65111' },
  { cityId: '455', cityName: 'Palembang', provinceName: 'Sumatera Selatan', postalCode: '30111' },
  { cityId: '80', cityName: 'Balikpapan', provinceName: 'Kalimantan Timur', postalCode: '76111' },
  { cityId: '89', cityName: 'Banjarmasin', provinceName: 'Kalimantan Selatan', postalCode: '70111' },
  { cityId: '300', cityName: 'Manado', provinceName: 'Sulawesi Utara', postalCode: '95111' },
  { cityId: '100', cityName: 'Pontianak', provinceName: 'Kalimantan Barat', postalCode: '78111' },
  { cityId: '410', cityName: 'Pekanbaru', provinceName: 'Riau', postalCode: '28111' },
];

interface MockServiceRate {
  service: string;
  serviceDescription: string;
  baseCost: number; // per kg base
  estimatedDays: number;
}

const COURIER_SERVICES: Record<CourierType, MockServiceRate[]> = {
  [CourierType.JNE]: [
    { service: 'REG', serviceDescription: 'Layanan Reguler', baseCost: 9000, estimatedDays: 3 },
    { service: 'YES', serviceDescription: 'Yakin Esok Sampai', baseCost: 29000, estimatedDays: 1 },
    { service: 'OKE', serviceDescription: 'Ongkos Kirim Ekonomis', baseCost: 6500, estimatedDays: 5 },
    { service: 'JTR', serviceDescription: 'JNE Trucking', baseCost: 4500, estimatedDays: 7 },
  ],
  [CourierType.JNT]: [
    { service: 'EZ', serviceDescription: 'J&T Express', baseCost: 8500, estimatedDays: 3 },
    { service: 'SUPER', serviceDescription: 'Super Express', baseCost: 25000, estimatedDays: 1 },
  ],
  [CourierType.SICEPAT]: [
    { service: 'REG', serviceDescription: 'SiCepat Reguler', baseCost: 8000, estimatedDays: 3 },
    { service: 'BEST', serviceDescription: 'Best Express', baseCost: 10000, estimatedDays: 2 },
    { service: 'GOKIL', serviceDescription: 'Gokil Murah', baseCost: 5500, estimatedDays: 6 },
  ],
  [CourierType.ANTERAJA]: [
    { service: 'REG', serviceDescription: 'Reguler', baseCost: 8500, estimatedDays: 3 },
    { service: '1D', serviceDescription: 'Next Day', baseCost: 22000, estimatedDays: 1 },
    { service: 'SD', serviceDescription: 'Same Day', baseCost: 35000, estimatedDays: 0 },
  ],
  [CourierType.GOSEND]: [
    { service: 'INSTANT', serviceDescription: 'GoSend Instant', baseCost: 15000, estimatedDays: 0 },
    { service: 'SAME_DAY', serviceDescription: 'GoSend Same Day', baseCost: 20000, estimatedDays: 0 },
  ],
  [CourierType.GRAB_EXPRESS]: [
    { service: 'INSTANT', serviceDescription: 'GrabExpress Instant', baseCost: 16000, estimatedDays: 0 },
    { service: 'SAME_DAY', serviceDescription: 'GrabExpress Same Day', baseCost: 21000, estimatedDays: 0 },
  ],
  [CourierType.POS_INDONESIA]: [
    { service: 'Pos Kilat Khusus', serviceDescription: 'Pos Kilat Khusus', baseCost: 7000, estimatedDays: 4 },
    { service: 'Pos Ekspres', serviceDescription: 'Pos Ekspres', baseCost: 18000, estimatedDays: 2 },
  ],
  [CourierType.TIKI]: [
    { service: 'REG', serviceDescription: 'Reguler', baseCost: 7500, estimatedDays: 4 },
    { service: 'ONS', serviceDescription: 'Over Night Service', baseCost: 28000, estimatedDays: 1 },
    { service: 'ECO', serviceDescription: 'Economy', baseCost: 5000, estimatedDays: 7 },
  ],
  [CourierType.WAHANA]: [
    { service: 'WPS', serviceDescription: 'Wahana Paket Standard', baseCost: 6000, estimatedDays: 5 },
    { service: 'WPE', serviceDescription: 'Wahana Paket Express', baseCost: 11000, estimatedDays: 2 },
  ],
};

// ─── Distance multiplier simulation (same-island vs inter-island) ─────────────
function getDistanceMultiplier(originId: string, destId: string): number {
  const javaIds = ['151', '152', '153', '154', '155', '114', '501', '131', '56', '255'];
  const isOriginJava = javaIds.includes(originId);
  const isDestJava = javaIds.includes(destId);
  if (originId === destId) return 0.7;
  if (isOriginJava && isDestJava) return 1.0;
  return 1.8; // inter-island
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

@Injectable()
export class RajaOngkirAdapter implements IShippingProvider {
  private readonly logger = new Logger(RajaOngkirAdapter.name);

  async searchCities(keyword: string): Promise<CityResult[]> {
    this.logger.debug(`[MOCK] searchCities: ${keyword}`);
    const lower = keyword.toLowerCase();
    return MOCK_CITIES.filter(
      (c) =>
        c.cityName.toLowerCase().includes(lower) ||
        c.provinceName.toLowerCase().includes(lower),
    );
  }

  async calculateCosts(
    originCityId: string,
    destinationCityId: string,
    weightGrams: number,
    couriers?: CourierType[],
  ): Promise<ShippingCostResult[]> {
    this.logger.debug(
      `[MOCK] calculateCosts: ${originCityId} → ${destinationCityId}, ${weightGrams}g`,
    );

    const weightKg = Math.ceil(weightGrams / 1000); // round up per kg
    const multiplier = getDistanceMultiplier(originCityId, destinationCityId);
    const selectedCouriers = couriers ?? Object.values(CourierType);

    const results: ShippingCostResult[] = [];

    for (const courier of selectedCouriers) {
      const services = COURIER_SERVICES[courier] ?? [];
      for (const svc of services) {
        const cost = Math.ceil(svc.baseCost * weightKg * multiplier / 1000) * 1000; // round to nearest 1000
        results.push({
          courier,
          service: svc.service,
          serviceDescription: svc.serviceDescription,
          cost,
          estimatedDays: svc.estimatedDays,
        });
      }
    }

    return results.sort((a, b) => a.cost - b.cost);
  }

  async trackShipment(
    trackingNumber: string,
    courier: CourierType,
  ): Promise<{
    status: string;
    history: Array<{ description: string; timestamp: Date; location?: string }>;
  }> {
    this.logger.debug(`[MOCK] trackShipment: ${trackingNumber} via ${courier}`);

    const now = new Date();
    const history = [
      {
        description: 'Paket diterima di gudang pengirim',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        location: 'Gudang Asal',
      },
      {
        description: 'Paket sedang dalam perjalanan ke kota tujuan',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        location: 'Hub Utama',
      },
      {
        description: 'Paket tiba di kota tujuan',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        location: 'Kota Tujuan',
      },
      {
        description: 'Kurir sedang mengantar paket',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        location: 'Dalam Perjalanan',
      },
    ];

    return { status: 'OUT_FOR_DELIVERY', history };
  }
}