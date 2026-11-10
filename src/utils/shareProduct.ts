import { Product } from '../redux/types/product.type';
import { getCategoryLabel } from '../constants/categories';
import { formatPrice } from './currency';
import { productShareUrl } from '../constants/links';
import { showAlert } from './dialog';
import { isGiftProduct, isPriceOpen } from './productPrice';

export type ShareableProduct = Pick<Product, '_id' | 'name' | 'price' | 'imgURL'> &
  Partial<Pick<Product, 'description' | 'category' | 'priceOpen'>>;

const MAX_DESCRIPTION_LENGTH = 120;

// Enlace que se comparte: https://<dominio>/p/<id>. Muestra una página con foto, nombre
// y precio (y la vista previa de WhatsApp/Facebook). Ver backend: routes/share.routes.js
export const getProductLink = (product: ShareableProduct) => productShareUrl(product._id);

export const buildShareMessage = (product: ShareableProduct) => {
  const lines = [
    `🛍️ ${product.name}`,
    isGiftProduct(product)
      ? '🎁 ¡Gratis!'
      : isPriceOpen(product)
        ? '💰 Recibe ofertas: ¡haz la tuya!'
        : `💲 ${formatPrice(product.price)}`,
  ];

  if (product.category) {
    lines.push(getCategoryLabel(product.category));
  }

  if (product.description) {
    const description =
      product.description.length > MAX_DESCRIPTION_LENGTH
        ? `${product.description.slice(0, MAX_DESCRIPTION_LENGTH).trim()}...`
        : product.description;
    lines.push('', description);
  }

  lines.push('', '¡Encuéntralo en Bart!', getProductLink(product));

  return lines.join('\n');
};

const openExternal = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const canUseSystemShare = () => typeof navigator !== 'undefined' && !!navigator.share;

// Menú del sistema (en celulares y algunos navegadores de escritorio)
export const shareWithSystem = async (product: ShareableProduct) => {
  try {
    await navigator.share({
      title: product.name,
      text: buildShareMessage(product),
    });
  } catch (err) {
    // El usuario cerró el menú: no es un error
    if ((err as Error)?.name !== 'AbortError') await copyProductLink(product);
  }
};

export const copyProductLink = async (product: ShareableProduct) => {
  const link = getProductLink(product);
  try {
    await navigator.clipboard.writeText(link);
    showAlert('Enlace copiado', 'Pégalo donde quieras compartirlo.');
  } catch {
    showAlert('Copia este enlace', link);
  }
};

// api.whatsapp.com abre la app en el celular y WhatsApp Web en el computador
export const shareOnWhatsApp = async (product: ShareableProduct) => {
  openExternal(`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareMessage(product))}`);
};

// Facebook ignora el texto prellenado: solo acepta un enlace
export const shareOnFacebook = async (product: ShareableProduct) => {
  openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getProductLink(product))}`);
};

export const shareOnTelegram = async (product: ShareableProduct) => {
  const link = encodeURIComponent(getProductLink(product));
  const text = encodeURIComponent(buildShareMessage(product));
  openExternal(`https://t.me/share/url?url=${link}&text=${text}`);
};

export const shareOnX = async (product: ShareableProduct) => {
  openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareMessage(product))}`);
};
