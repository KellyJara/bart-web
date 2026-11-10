import api from '../api/axios';

export type ReportCounts = {
  published: number;
  messages: number; // toques en "Contactar por WhatsApp"
  offers: number; // toques en "Hacer una oferta"
  sold: number;
  gifted: number;
};

export type DailyRow = ReportCounts & {
  day: string; // "2026-11-08"
  newUsers: number; // cuentas creadas
  logins: number; // personas distintas que iniciaron sesión
  activeUsers: number; // personas distintas que usaron la app con su sesión iniciada
};

export type UsersSummary = {
  newUsers: number; // en el periodo
  loginUsers: number; // personas distintas que iniciaron sesión en el periodo
  activeUsers: number; // personas distintas que usaron la app en el periodo
  total: number; // registrados en total
};

export type AdminReport = {
  days: number;
  from: string;
  to: string;
  totals: ReportCounts; // del periodo elegido
  allTime: ReportCounts; // desde siempre
  users: UsersSummary;
  contactsTrackedSince: string | null; // desde cuándo hay registro diario de mensajes/ofertas
  usersTrackedSince: string | null; // desde cuándo se registran inicios de sesión y actividad
  daily: DailyRow[];
};

export const reportService = {
  // Solo administradores
  getAdmin: (days: number) => api.get<AdminReport>('/reports/admin', { params: { days } }).then(r => r.data),
};
