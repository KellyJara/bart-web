import { formatPrice } from './currency';

// Tipos de precio (igual que el backend, Bart-backend/src/libs/price.js):
//  - regalo:          price === 0
//  - precio abierto:  priceOpen (sin precio: el vendedor no sabe cuánto pedir y recibe ofertas)
//  - precio fijo:     price > 0
type Priced = { price?: number | null; priceOpen?: boolean };

export type PriceMode = 'fixed' | 'offers' | 'gift';

export const isGiftProduct = (p?: Priced | null) => !!p && p.price === 0 && !p.priceOpen;
export const isPriceOpen = (p?: Priced | null) => !!p?.priceOpen;

export const getPriceMode = (p?: Priced | null): PriceMode =>
  isGiftProduct(p) ? 'gift' : isPriceOpen(p) ? 'offers' : 'fixed';

/** Texto del precio para mostrar: "$ 80.000", "🎁 Gratis" o "💰 Recibe ofertas". */
export const getPriceLabel = (p?: Priced | null) =>
  isGiftProduct(p) ? '🎁 Gratis' : isPriceOpen(p) || p?.price == null ? '💰 Recibe ofertas' : formatPrice(p.price);
