import { storage } from '../redux/slices/auth/authStorage';

export type Coords = { latitude: number; longitude: number };

// denied: el usuario todavía no dio permiso (se puede volver a preguntar)
// blocked: el navegador recuerda el rechazo -> solo se activa desde la configuración del sitio
// unavailable: sin señal, sin GPS o tiempo agotado
export type LocationErrorReason = 'denied' | 'blocked' | 'unavailable';

export class LocationError extends Error {
  reason: LocationErrorReason;
  constructor(reason: LocationErrorReason) {
    super(`Ubicación no disponible: ${reason}`);
    this.reason = reason;
  }
}

// Estado del permiso sin mostrar ningún diálogo (Safari antiguo no tiene Permissions API)
const queryPermission = async (): Promise<PermissionState | null> => {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return null;
  }
};

const readPosition = (): Promise<Coords> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      err =>
        // En la web, una vez rechazado el navegador ya no vuelve a preguntar
        reject(new LocationError(err.code === err.PERMISSION_DENIED ? 'blocked' : 'unavailable')),
      // Precisión baja: basta con saber la zona
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });

/**
 * Lee la ubicación (el navegador muestra su diálogo si hace falta).
 * Usar SOLO después de que el usuario aceptó en la app (consentimiento).
 */
export const getCurrentLocation = async (): Promise<Coords> => {
  if ((await queryPermission()) === 'denied') throw new LocationError('blocked');
  return readPosition();
};

/**
 * Lee la ubicación SIN mostrar ningún diálogo: solo si el permiso
 * ya está concedido. Si no, falla con 'denied'.
 */
export const getLocationIfAllowed = async (): Promise<Coords> => {
  const state = await queryPermission();
  if (state === 'denied') throw new LocationError('blocked');
  if (state !== 'granted') throw new LocationError('denied');
  return readPosition();
};

/* ---------- Consentimiento dentro de la app ----------
 * Antes de mostrar el permiso del navegador explicamos para qué usamos la ubicación
 * y el usuario decide. Guardamos su respuesta para no volver a preguntar.
 */
export type LocationConsent = 'accepted' | 'declined';
const CONSENT_KEY = 'locationConsent';

export const getLocationConsent = async (): Promise<LocationConsent | null> => {
  const value = storage.read(CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
};

export const saveLocationConsent = async (consent: LocationConsent) => {
  storage.write(CONSENT_KEY, consent);
};
