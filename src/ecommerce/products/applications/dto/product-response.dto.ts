import { IProductResponse } from '../../domains/mappers/product.mapper';
import { VarietyDetails } from '../../domains/constants/variety-info.constant';

export class ProductResponseDto implements IProductResponse {
  id: string = '';
  name: string = '';
  description: string = '';
  price: number = 0;
  stock: number = 0;
  weightInGrams: number = 0;
  imageUrl: string | null = null;
  status: string = '';
  variety: {
    code: string;
    details: VarietyDetails;
  } = {
    code: '',
    details: {} as VarietyDetails,
  };
  isAiVerified: boolean = false;
  createdAt: Date = new Date();
}