import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { MarketPriceEntryDto } from '../../applications/dto/market-price-entry.dto';
import { DurianVarietyCode } from '../entities/market-price.entity';

const VALID_VARIETY_CODES = new Set<string>(Object.values(DurianVarietyCode));

@Injectable()
export class MarketPriceValidator {
  private readonly logger = new Logger(MarketPriceValidator.name);

  filterWholeAndValid(
    entries: MarketPriceEntryDto[],
    runId:   string,
  ): { valid: MarketPriceEntryDto[]; rejectedCount: number } {
    const valid: MarketPriceEntryDto[] = [];
    let rejectedCount = 0;

    for (const entry of entries) {
      const rejectionReason = this.getRejectionReason(entry);

      if (rejectionReason !== null) {
        this.logger.warn(
          `[MarketPriceValidator] Entry ditolak — run_id=${runId}, ` +
            `variety=${entry.variety_code}, ` +
            `alias='${entry.variety_alias}', ` +
            `reason=${rejectionReason}`,
        );
        rejectedCount++;
        continue;
      }

      valid.push(entry);
    }

    return { valid, rejectedCount };
  }

  assertAtLeastOnePrice(entry: MarketPriceEntryDto): void {
    const prices = [
      entry.price_per_kg_min,
      entry.price_per_kg_max,
      entry.price_per_kg_avg,
      entry.price_per_unit_min,
      entry.price_per_unit_max,
    ];

    const hasPrice = prices.some((p) => p !== null && p !== undefined);

    if (!hasPrice) {
      throw new UnprocessableEntityException(
        `Entry variety='${entry.variety_code}' tidak memiliki field harga yang terisi.`,
      );
    }
  }

  private getRejectionReason(entry: MarketPriceEntryDto): string | null {
    if (!entry.is_whole_fruit) {
      return 'is_whole_fruit=false (produk bukan durian utuh)';
    }

    const normalizedCode = entry.variety_code?.toString().trim().toUpperCase();
    if (!normalizedCode || !VALID_VARIETY_CODES.has(normalizedCode)) {
      return `variety_code tidak dikenal: '${entry.variety_code}'`;
    }

    const prices = [
      entry.price_per_kg_min,
      entry.price_per_kg_max,
      entry.price_per_kg_avg,
      entry.price_per_unit_min,
      entry.price_per_unit_max,
    ];

    const hasPrice = prices.some((p) => p !== null && p !== undefined && p >= 0);
    if (!hasPrice) {
      return 'tidak ada field harga yang terisi (semua null)';
    }

    return null;
  }
}