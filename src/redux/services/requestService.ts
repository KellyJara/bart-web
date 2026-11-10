import api from '../api/axios';

// Estado del trato de un producto. Las postulaciones a regalos y las ofertas guardadas
// se eliminaron: ahora todo el contacto es por WhatsApp. Solo quedan las acciones del dueño.
export const requestService = {
  // El dueño libera una reserva que quedó del sistema anterior (vuelve a estar disponible)
  release: (productId: string) => api.post(`/requests/product/${productId}/release`),

  // Marcar como vendido/regalado (ya no disponible) y deshacerlo
  // recipientId (opcional): a quién se lo vendió/regaló (de "Contactos por WhatsApp").
  // Con receptor (venta o regalo): los 50 puntos llegan cuando esa persona deja su reseña.
  complete: (productId: string, recipientId?: string) =>
    // Los puntos se ganan cuando quien lo compró o recibió deja su reseña (pointsPending)
    api.post<{ message: string; pointsAwarded?: number; pointsPending?: number }>(
      `/requests/product/${productId}/complete`,
      recipientId ? { recipientId } : {}
    ),
  reopen: (productId: string) =>
    api.post<{ message: string; pointsRevoked?: number }>(`/requests/product/${productId}/reopen`),
};

export const getApiErrorMessage = (error: any, fallback = 'Ocurrió un error. Intenta de nuevo.') =>
  error?.response?.data?.message || fallback;
