import { SellerRating } from './review.type';

export interface Product {
 _id: string;
  name: string;
  category: string;
  price: number | null; // 0 = regalo; null si priceOpen
  priceOpen?: boolean; // sin precio: el vendedor recibe ofertas
  imgURL: string; // portada (= images[0])
  images?: string[]; // hasta 4 fotos; productos antiguos pueden no tenerlo
  description: string;
  stock: number;
  isActive: boolean;
  inCart: boolean;
  owner: ProductOwner;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number; // solo en búsquedas por cercanía
  locationLabel?: string; // "Barrio, Ciudad" donde está el producto (nunca la dirección exacta)
  acceptsOffers?: boolean; // venta: acepta que le propongan otro precio
  favoritesCount?: number; // cuántas personas lo tienen en favoritos
  dealStatus?: 'available' | 'reserved' | 'completed'; // completed = vendido o regalado
  completedAt?: string | null;
  reservedFor?: string | null;
  soldTo?: string | null; // a quién se vendió/regaló (puede calificar al vendedor)
}

export interface ProductLocation {
  latitude: number;
  longitude: number;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  price: number | null;
  priceOpen?: boolean; // sin precio: recibe ofertas
  imgURL: string;
  description: string;
  stock?: number;
  isActive?: boolean;
  inCart?: boolean;
  location?: ProductLocation;
  locationLabel?: string; // "Barrio, Ciudad" (lo que ven los compradores)
  acceptsOffers?: boolean;
  images?: string[]; // hasta 4; el backend pone imgURL = images[0]
}

// Fotos de un producto: las nuevas vienen en images; las antiguas solo en imgURL
export const getProductImages = (p: Pick<Product, 'imgURL' | 'images'>) =>
  p.images?.length ? p.images : p.imgURL ? [p.imgURL] : [];

// Filtros del listado principal (GET /products)
export interface ProductFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  type?: 'sale' | 'gift';
  category?: string;
  available?: boolean; // true = sin productos reservados
  q?: string; // buscar por nombre
}

export interface updateProductPayload {
  priceOpen?: boolean;
  location?: ProductLocation;
  locationLabel?: string;
  acceptsOffers?: boolean;
  name?: string;
  category?: string;
  price?: number | null;
  imgURL?: string;
  images?: string[];
  description?: string;
  stock?: number;
  isActive?: boolean;
  inCart?: boolean;
}

export interface ProductOwner {
  _id: string;
  username: string;
  sellerRating?: SellerRating; // promedio de reseñas como vendedor
  profileImg: string; 
  points?: number; // con 1000 o más es usuario verificado
}

export interface ProductState {
 items: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}
