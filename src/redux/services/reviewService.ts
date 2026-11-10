import api from '../api/axios';
import { Review, SellerRating, SellerReviewsResponse } from '../types/review.type';

export const reviewService = {
  // Reseñas públicas de un vendedor (de 20 en 20; before = fecha de la última cargada)
  getSellerReviews: (sellerId: string, before?: string) =>
    api.get<SellerReviewsResponse>(`/reviews/seller/${sellerId}`, { params: before ? { before } : undefined }),

  // ¿Puedo calificar al vendedor de este producto? Y mi reseña si ya existe
  getMine: (productId: string) =>
    api.get<{ canReview: boolean; review: Review | null }>(`/reviews/product/${productId}/mine`),

  save: (productId: string, data: { rating: number; comment?: string }) =>
    api.post<{ review: Review; sellerRating: SellerRating }>(`/reviews/product/${productId}`, data),

  remove: (productId: string) => api.delete(`/reviews/product/${productId}`),
};
