// Calificación de un vendedor (promedio y cantidad de reseñas)
export interface SellerRating {
  average: number;
  count: number;
}

export interface Review {
  _id: string;
  seller: string;
  reviewer: string | { _id: string; username: string; profileImg?: string };
  product: string | { _id: string; name: string; imgURL?: string } | null;
  rating: number; // 1 a 5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerReviewsResponse {
  summary: SellerRating & { distribution: Record<'1' | '2' | '3' | '4' | '5', number> };
  reviews: Review[];
  hasMore: boolean;
}
