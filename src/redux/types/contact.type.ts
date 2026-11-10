import { SellerRating } from './review.type';

// Persona que contactó al vendedor por WhatsApp desde un producto
export interface ProductContact {
  _id: string;
  product: string;
  buyer: {
    _id: string;
    username: string;
    profileImg?: string;
    sellerRating?: SellerRating;
    points?: number;
    createdAt?: string;
  };
  count: number; // veces que tocó "Contactar" o "Hacer una oferta"
  lastContactAt: string;
  // Ofertas hechas con "Hacer una oferta" (se envían por WhatsApp; Bart guarda el registro)
  offerCount?: number;
  lastOfferAmount?: number | null;
  lastOfferAt?: string | null;
}

export interface ProductContactsResponse {
  soldTo: string | null; // a quién se vendió/regaló (si ya se indicó)
  contacts: ProductContact[];
}

// Comprador: producto por el que contactó al vendedor o hizo una oferta (su registro)
export interface MyContact {
  _id: string;
  product: {
    _id: string;
    name: string;
    imgURL?: string;
    images?: string[];
    price: number;
    dealStatus?: 'available' | 'reserved' | 'completed';
    isActive?: boolean;
    locationLabel?: string;
  } | null; // null si el vendedor lo eliminó
  seller: { _id: string; username: string; profileImg?: string } | null;
  count: number; // veces que tocó "Contactar" o "Hacer una oferta"
  offerCount: number;
  lastOfferAmount: number | null;
  lastOfferAt: string | null;
  lastContactAt: string;
  createdAt: string;
  boughtByMe: boolean; // el vendedor marcó que me lo vendió/regaló
}
