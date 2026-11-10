import { Product } from './product.type';
import { SellerRating } from './review.type';

export interface Role {
  _id: string;
  name: string;
}

export interface CartItem {
  _id: string;
  quantity: number;
  product: Product;
}

export interface OtherUser {
  _id: string;
  username: string;
  email: string;
  aboutMe?: string;
  profileImg?: string;
  sellerRating?: SellerRating; // promedio de reseñas como vendedor
  points?: number; // +50 por cada reseña recibida (venta o regalo); con 1000 es verificado
  roles: Role[];
  cart: CartItem[];
  favorites: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface OtherUserResponse {
  user: OtherUser;
  products: Product[];
  cart?: CartItem[];
  favorites?: Product[];
}