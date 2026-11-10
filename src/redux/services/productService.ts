import api from '../api/axios';
import { Product,CreateProductPayload, updateProductPayload, ProductFilters } from '../types/product.type';

export const productService = {
  getAll: (filters?: ProductFilters) => api.get<Product[]>('/products', { params: filters }),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  create: (product: CreateProductPayload) =>
    api.post<Product>('/products', product),

  update: (id: string, product: updateProductPayload) =>
    api.put<Product>(`/products/${id}`, product),

  remove: (id: string) =>
    api.delete<void>(`/products/${id}`)
};
