export type PqrType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';

// Reporte de usuario o PQR enviado a soporte
export interface SupportTicket {
  _id: string;
  kind: 'user_report' | 'pqr';
  reportedUser?: { _id: string; username: string; profileImg?: string } | null;
  reason?: string;
  pqrType?: PqrType;
  subject?: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: string;
}
