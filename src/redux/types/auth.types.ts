export interface AuthResponse {
  token: string;
  roles: string[];
  userId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  // Celular de Colombia con indicativo, solo dígitos: 573207452694 (no se verifica)
  whatsapp: string;
  password: string;
}

// El registro no inicia sesión: primero hay que verificar el correo con el PIN
export interface SignupResponse {
  message: string;
  email: string;
  emailSent: boolean;
}

export interface VerifyEmailPayload {
  email: string;
  pin: string;
}

// Valor con el que se rechaza el login si el correo no está verificado
export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

export interface AuthState {
  token: string | null;
  roles: string[];
  userId: string | null;
  loading: boolean;
  error: string | null;
}
