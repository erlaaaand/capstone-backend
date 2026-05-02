import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum DurianVarietyCode {
  D13  = 'D13',
  D197 = 'D197',
  D2   = 'D2',
  D200 = 'D200',
  D24  = 'D24',
}

const decimalTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value;
  },
  from(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  },
};

@Entity({ name: 'market_prices' })
export class MarketPriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @BeforeInsert()
  generateId(): void {
    if (!this.id || this.id.trim().length === 0) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'enum', enum: DurianVarietyCode, nullable: false })
  varietyCode: DurianVarietyCode = DurianVarietyCode.D197;

  @Column({ type: 'varchar', length: 100, nullable: false })
  varietyAlias: string = '';

  @Column({
    type:        'decimal',
    precision:   12,
    scale:       2,
    nullable:    true,
    default:     null,
    transformer: decimalTransformer,
  })
  pricePerKgMin: number | null = null;

  @Column({
    type:        'decimal',
    precision:   12,
    scale:       2,
    nullable:    true,
    default:     null,
    transformer: decimalTransformer,
  })
  pricePerKgMax: number | null = null;

  @Column({
    type:        'decimal',
    precision:   12,
    scale:       2,
    nullable:    true,
    default:     null,
    transformer: decimalTransformer,
  })
  pricePerKgAvg: number | null = null;

  @Column({
    type:        'decimal',
    precision:   12,
    scale:       2,
    nullable:    true,
    default:     null,
    transformer: decimalTransformer,
  })
  pricePerUnitMin: number | null = null;

  @Column({
    type:        'decimal',
    precision:   12,
    scale:       2,
    nullable:    true,
    default:     null,
    transformer: decimalTransformer,
  })
  pricePerUnitMax: number | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true, default: null })
  locationHint: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  sellerType: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: false })
  weightReference: string = '';

  @Column({ type: 'text', nullable: true, default: null })
  notes: string | null = null;

  @Column({ type: 'float', nullable: false, default: 0.5 })
  confidence: number = 0.5;

  @Column({ type: 'text', nullable: true, default: null })
  rawTextSnippet: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  sourceName: string = '';

  @Column({ type: 'varchar', length: 512, nullable: false })
  sourceUrl: string = '';

  @Column({ type: 'varchar', length: 36, nullable: false })
  runId: string = '';

  @Column({ type: 'varchar', length: 20, nullable: false })
  agentVersion: string = '';

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date = new Date();
}