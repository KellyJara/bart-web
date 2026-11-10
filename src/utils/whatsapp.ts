import api from '../redux/api/axios';
import { contactService } from '../redux/services/contactService';
import { showAlert } from './dialog';
import { formatPrice } from './currency';

// wa.me solo acepta dígitos con el código de país, sin "+", espacios ni guiones
const toWaNumber = (phone: string) => phone.replace(/\D/g, '');

// ---------- Campo de celular de Colombia (registro y perfil) ----------
export const PHONE_LENGTH = 10;

/** Celular de Colombia: 10 dígitos que empiezan por 3. */
export const isColombianMobile = (digits: string) => /^3\d{9}$/.test(digits);

/** "3207452694" -> "320 745 2694" mientras se escribe. */
export const formatPhoneInput = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');

/** Texto del campo -> solo los 10 dígitos (quita el +57 si lo pegan con indicativo). */
export const cleanPhoneInput = (text: string) => {
  let digits = text.replace(/\D/g, '');
  if (digits.length > PHONE_LENGTH && digits.startsWith('57')) digits = digits.slice(2);
  return digits.slice(0, PHONE_LENGTH);
};

/** "573207452694" (como lo guarda el backend) -> "3207452694"; '' si no hay número. */
export const toLocalPhone = (stored?: string | null) => cleanPhoneInput(stored ?? '');

// "573207452694" -> "+57 320 745 2694" (para mostrarlo en el perfil)
export const formatWhatsappForDisplay = (phone?: string | null) => {
  const digits = toWaNumber(phone ?? '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
};

export const buildContactMessage = (username: string) =>
  `Hola ${username}, te escribo desde Bart 👋`;

// Mensaje cuando se contacta desde un producto: menciona cuál es
export const buildProductContactMessage = (username: string, productName: string) =>
  `Hola ${username}, te escribo desde Bart 👋 Me interesa tu producto "${productName}".`;

// Mensaje de una oferta: "Hola Ana, te escribo desde Bart 👋 Te ofrezco $ 80.000 por tu producto "Bicicleta"."
export const buildOfferMessage = (username: string, productName: string, amount: number) =>
  `Hola ${username}, te escribo desde Bart 👋 Te ofrezco ${formatPrice(amount)} por tu producto "${productName}".`;

const waUrl = (phone: string, message: string) =>
  `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;

/**
 * Abre WhatsApp (app o WhatsApp Web) después de pedir el número al backend.
 * La pestaña se abre antes de la petición: si se abriera después, el navegador
 * la bloquearía como ventana emergente.
 */
const openAfterLookup = async (lookup: () => Promise<string | null>, sellerName: string, message: string) => {
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  try {
    const whatsapp = await lookup();
    if (!whatsapp) {
      tab?.close();
      showAlert('WhatsApp', `${sellerName} todavía no ha agregado su número de WhatsApp.`);
      return;
    }
    const url = waUrl(whatsapp, message);
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch {
    tab?.close();
    showAlert('WhatsApp', 'No se pudo obtener el contacto del vendedor. Intenta de nuevo.');
  }
};

/**
 * Contactar al vendedor desde un producto: el backend registra el contacto
 * (el vendedor ve quién le escribió) y devuelve su WhatsApp para abrir el chat.
 */
export const contactSellerAboutProduct = (
  productId: string,
  sellerName: string,
  message: string,
  offerAmount?: number, // si es una oferta, queda registrada con el monto
) =>
  openAfterLookup(
    async () => (await contactService.contactByWhatsapp(productId, offerAmount)).data.whatsapp,
    sellerName,
    message,
  );

/**
 * Pide al backend el WhatsApp del vendedor (requiere sesión) y abre el chat.
 * Si el vendedor no lo ha agregado, avisa al usuario.
 */
export const contactSellerOnWhatsApp = (sellerId: string, sellerName: string, message: string) =>
  openAfterLookup(
    async () => (await api.get<{ whatsapp: string | null }>(`/user/${sellerId}/whatsapp`)).data.whatsapp,
    sellerName,
    message,
  );
