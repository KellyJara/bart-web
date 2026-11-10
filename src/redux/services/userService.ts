import api from '../api/axios';

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

// Códigos de error del backend al cambiar la contraseña
export type ChangePasswordErrorCode = 'WRONG_PASSWORD' | 'SAME_PASSWORD' | 'WEAK_PASSWORD';

export const userService = {
  /** PUT /user/profile/password — pide la contraseña actual. */
  changePassword: (payload: ChangePasswordPayload) =>
    api.put<{ message: string }>('/user/profile/password', payload),
};
