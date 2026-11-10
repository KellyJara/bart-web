import { NavigateFunction } from 'react-router-dom';

type NotificationData = { [key: string]: string | object | undefined };

// Abre la página de un aviso de la campanita
// (igual que openNotificationTarget de la app móvil, src/utils/pushNotifications.ts)
export const openNotificationTarget = (navigate: NavigateFunction, data?: NotificationData) => {
  if (!data) return;

  // Alguien tocó "Contactar" o "Hacer una oferta" en mi producto: abrir quién me contactó
  if (data.type === 'contact' && data.productId) {
    navigate(`/products/${data.productId}/contacts`);
    return;
  }
  // Ofertas/postulaciones (avisos antiguos) y respuestas: abrir el producto
  if (data.type === 'request' && data.productId) {
    navigate(`/product/${data.productId}`);
    return;
  }
  // Reseña recibida: abrir mis reseñas como vendedor
  if (data.type === 'review' && data.sellerId) {
    navigate(`/seller/${data.sellerId}/reviews`);
    return;
  }
  if (data.type === 'product' && data.productId) {
    navigate(`/product/${data.productId}`);
  }
};
