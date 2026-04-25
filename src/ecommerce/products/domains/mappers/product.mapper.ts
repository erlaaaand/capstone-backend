import { ProductEntity } from '../entities/product.entity';
import { VarietyDetails } from '../constants/variety-info.constant';

// Bentuk response akhir yang akan diterima frontend
export interface IProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  weightInGrams: number;
  imageUrl: string | null;
  status: string;
  variety: {
    code: string;
    details: VarietyDetails;
  };
  isAiVerified: boolean;
  createdAt: Date;
}

export class ProductMapper {
  /**
   * Mengubah ProductEntity menjadi objek balikan API yang kaya informasi
   */
  public static toResponse(entity: ProductEntity): IProductResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: Number(entity.price), // Pastikan desimal dari DB diubah jadi Number
      stock: entity.stock,
      weightInGrams: entity.weightInGrams,
      imageUrl: entity.imageUrl,
      status: entity.status,
      variety: {
        code: entity.variety,
        details: entity.getVarietyDetails(), // Menyisipkan data lengkap seperti 'Musang King', deskripsi, dll
      },
      // Flag boolean sederhana untuk UI frontend
      isAiVerified: entity.predictionId ? true : false,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Mengubah kumpulan ProductEntity menjadi array response
   */
  public static toResponseList(entities: ProductEntity[]): IProductResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}