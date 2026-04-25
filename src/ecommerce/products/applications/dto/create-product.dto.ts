import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductVariety } from '../../domains/enums/product-variety.enum';
import { ProductStatus } from '../../domains/enums/product-status.enum';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama produk tidak boleh kosong.' })
  @MaxLength(255, { message: 'Nama produk maksimal 255 karakter.' })
  name: string = '';

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductVariety, { message: 'Varietas tidak valid. Pilih dari: D2, D13, D24, D197, D200.' })
  @IsNotEmpty()
  variety: ProductVariety = ProductVariety.D2;

  @IsNumber({}, { message: 'Harga harus berupa angka.' })
  @Min(0, { message: 'Harga tidak boleh negatif.' })
  price: number = 0;

  @IsInt({ message: 'Stok harus berupa bilangan bulat.' })
  @Min(0, { message: 'Stok tidak boleh negatif.' })
  stock: number = 0;

  @IsInt({ message: 'Berat harus berupa bilangan bulat dalam gram.' })
  @IsPositive({ message: 'Berat harus lebih dari 0 gram.' })
  weightInGrams: number = 0;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(ProductStatus, { message: 'Status tidak valid.' })
  @IsOptional()
  status?: ProductStatus;

  @IsUUID('4', { message: 'predictionId harus berupa UUID v4 yang valid.' })
  @IsOptional()
  predictionId?: string;
}