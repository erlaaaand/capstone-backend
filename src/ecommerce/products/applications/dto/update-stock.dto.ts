import { IsEnum, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export enum StockAction {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export class UpdateStockDto {
  @IsEnum(StockAction, { message: 'Action harus berupa INCREASE atau DECREASE.' })
  @IsNotEmpty()
  action: StockAction = StockAction.INCREASE;

  @IsInt({ message: 'Jumlah harus berupa bilangan bulat.' })
  @IsPositive({ message: 'Jumlah harus lebih dari 0.' })
  quantity: number = 1;
}