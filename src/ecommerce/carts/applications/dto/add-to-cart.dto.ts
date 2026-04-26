import { IsInt, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsUUID('4', { message: 'productId harus berupa UUID v4 yang valid.' })
  @IsNotEmpty({ message: 'productId tidak boleh kosong.' })
  productId: string = '';

  @IsInt({ message: 'Jumlah harus berupa bilangan bulat.' })
  @IsPositive({ message: 'Jumlah harus lebih dari 0.' })
  quantity: number = 1;
}