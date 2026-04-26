import { IsInt, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt({ message: 'Jumlah harus berupa bilangan bulat.' })
  @IsPositive({ message: 'Jumlah harus lebih dari 0. Gunakan endpoint hapus item jika ingin menghapus.' })
  quantity: number = 1;
}