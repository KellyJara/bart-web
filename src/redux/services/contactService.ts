import api from '../api/axios';
import { MyContact, ProductContactsResponse } from '../types/contact.type';

export const contactService = {
  // Registra el contacto (y la oferta, si viene offerAmount) y devuelve el WhatsApp del vendedor (null si no tiene)
  contactByWhatsapp: (productId: string, offerAmount?: number) =>
    api.post<{ whatsapp: string | null }>(
      `/contacts/product/${productId}`,
      offerAmount ? { offerAmount } : {}
    ),

  // Dueño: quién lo contactó por este producto
  getForProduct: (productId: string) =>
    api.get<ProductContactsResponse>(`/contacts/product/${productId}`),

  // Comprador: a quién le escribí y cuánto ofrecí (registro)
  getMine: () => api.get<MyContact[]>('/contacts/mine'),

  // Dueño: { [productId]: cantidad de personas que contactaron }
  getSummary: () => api.get<Record<string, number>>('/contacts/received'),
};
