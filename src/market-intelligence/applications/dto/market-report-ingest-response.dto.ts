import { ApiProperty } from '@nestjs/swagger';

export class MarketReportIngestResponseDto {
  @ApiProperty({
    description: 'Menandakan laporan berhasil diterima dan divalidasi.',
    example:     true,
  })
  accepted: boolean = false;

  @ApiProperty({
    description: 'UUID run yang diproses, dikembalikan untuk konfirmasi.',
    example:     '1d80556a-e906-4729-976a-0951038dfcc9',
    format:      'uuid',
  })
  run_id: string = '';

  @ApiProperty({
    description: 'Jumlah entri harga yang berhasil disimpan ke database.',
    example:     8,
    minimum:     0,
  })
  entries_saved: number = 0;

  @ApiProperty({
    description:
      'Jumlah entri yang ditolak di layer NestJS ' +
      '(is_whole_fruit=false, variety_code tidak dikenal, atau tidak ada harga).',
    example:  2,
    minimum:  0,
  })
  entries_rejected: number = 0;

  @ApiProperty({
    description: 'Pesan ringkas hasil pemrosesan.',
    example:     'Laporan diterima. 8 entri disimpan, 2 ditolak.',
  })
  message: string = '';
}