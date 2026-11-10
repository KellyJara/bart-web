import api from '../api/axios';
import { PqrType, SupportTicket } from '../types/support.type';

type ReportPayload = { reason: string; comments?: string };

export const supportService = {
  reportProduct: (productId: string, data: ReportPayload) =>
    api.post(`/products/${productId}/report`, data),

  reportUser: (userId: string, data: ReportPayload) =>
    api.post(`/support/users/${userId}/report`, data),

  createPqr: (data: { type: PqrType; subject: string; message: string }) =>
    api.post<{ message: string }>('/support/pqr', data),

  // Reportes de usuarios y PQR enviados (los reportes de productos no aparecen aquí)
  getMine: () => api.get<SupportTicket[]>('/support/mine'),
};
