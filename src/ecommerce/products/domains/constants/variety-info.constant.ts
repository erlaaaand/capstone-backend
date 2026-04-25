import { ProductVariety } from '../enums/product-variety.enum';

export interface VarietyDetails {
  displayName: string;
  localName: string;
  origin: string;
  description: string;
}

export const VARIETY_MAP: Record<ProductVariety, VarietyDetails> = {
  [ProductVariety.D2]: {
    displayName: 'Dato Nina',
    localName: 'D2 / Dato Nina',
    origin: 'Malaysia (Melaka)',
    description: 'Durian dengan bentuk buah agak bulat. Daging buahnya berwarna tembaga atau kuning kecokelatan dengan kombinasi rasa manis dan sedikit pahit.',
  },
  [ProductVariety.D13]: {
    displayName: 'Golden Bun',
    localName: 'D13 / Golden Bun',
    origin: 'Malaysia (Johor)',
    description: 'Memiliki daging berwarna oranye kemerahan yang pekat. Rasanya manis, sangat wangi, dan bijinya besar. Ciri luarnya cenderung membulat dengan duri tebal.',
  },
  [ProductVariety.D24]: {
    displayName: 'Sultan',
    localName: 'D24 / Sultan / Bukit Merah',
    origin: 'Malaysia (Perak / Selangor)',
    description: 'Varietas legendaris dengan daging kuning pucat hingga krem. Rasa pahit-manis yang kaya. Ciri fisik luarnya memiliki duri yang cukup tajam dan rapat dengan bentuk cenderung oval.',
  },
  [ProductVariety.D197]: {
    displayName: 'Musang King',
    localName: 'D197 / Musang King / Raja Kunyit / Mao Shan Wang',
    origin: 'Malaysia (Kelantan)',
    description: 'Raja durian Malaysia dengan daging kuning-emas tebal. Rasa kaya manis-pahit yang kompleks. Ciri khas luarnya memiliki pola bintang (star-shape) botak di bagian bawah dan duri berbentuk piramida.',
  },
  [ProductVariety.D200]: {
    displayName: 'Black Thorn',
    localName: 'D200 / Ochee / Duri Hitam / Black Thorn',
    origin: 'Malaysia (Penang)',
    description: 'Durian super premium dengan daging oranye kemerahan dan rasa manis-pahit yang sangat pekat. Ciri khas luarnya bentuknya membulat dengan garis lekukan di bagian bawah dan ujung duri berwarna kehitaman.',
  },
};
