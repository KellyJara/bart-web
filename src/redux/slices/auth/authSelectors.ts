import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';

//Auth selectors

export const selectIsConnected = (state: RootState) =>Boolean(state.auth.token);

// Roles del login, o del perfil cargado: al reabrir la app solo se recupera el token
// (no los roles), así que sin esto un admin dejaría de verse como admin
const hasRole = (state: RootState, role: string) =>
  state.auth.roles.includes(role) ||
  !!state.user.currentUser?.roles?.some(r => (typeof r === 'string' ? r : r?.name) === role);

export const selectIsAdmin = (state: RootState) => hasRole(state, 'admin');
//selector for selected product
 export const selectSelectedProductOwnerUsername = (
  state: RootState
): string | null =>
  state.products.selectedProduct?.owner?.username ?? null;

// Mis productos, más nuevos arriba (sin depender del orden en que llegaron o se agregaron).
// Memorizado: solo se recalcula cuando cambian los productos o el usuario.
export const selectMyProducts = createSelector(
  [(state: RootState) => state.products.items, (state: RootState) => state.auth.userId],
  (items, userId) =>
    userId
      ? items
          .filter(product => product.owner?._id === userId)
          .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      : []
);