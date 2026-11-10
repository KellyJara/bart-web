import { useCallback } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import { selectIsConnected } from '../redux/slices/auth/authSelectors';

// Acción que el usuario intentó hacer antes de iniciar sesión y página a la que vuelve.
// Se ejecuta automáticamente al terminar el login/registro.
let pendingAction: (() => void) | null = null;
let returnTo = '/';

const currentPath = () => window.location.pathname + window.location.search;

// Guarda a dónde volver (p. ej. al abrir una página protegida sin sesión)
export const rememberReturnTo = (path: string) => {
  returnTo = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/verify') ? '/' : path;
};

// Abre la pantalla de Login y guarda la acción para continuar después
export const requestLogin = (navigate: NavigateFunction, action?: () => void) => {
  pendingAction = action ?? null;
  rememberReturnTo(currentPath());
  navigate('/login');
};

// Llamar cuando el login o registro fue exitoso: vuelve a la página donde estaba
// y continúa con lo que el usuario quería hacer
export const completeLogin = (navigate: NavigateFunction) => {
  navigate(returnTo, { replace: true });
  returnTo = '/';

  const action = pendingAction;
  pendingAction = null;
  if (action) {
    // Esperar a que termine la navegación de regreso
    setTimeout(action, 0);
  }
};

/**
 * Devuelve requireAuth(action): ejecuta la acción si hay sesión,
 * si no, pide iniciar sesión y la ejecuta después.
 * Con resume: false solo pide el login (útil para acciones tipo "toggle").
 */
export const useRequireAuth = () => {
  const navigate = useNavigate();
  const isConnected = useAppSelector(selectIsConnected);

  return useCallback(
    (action: () => void, options: { resume?: boolean } = {}) => {
      if (isConnected) {
        action();
        return;
      }
      requestLogin(navigate, options.resume === false ? undefined : action);
    },
    [isConnected, navigate],
  );
};
