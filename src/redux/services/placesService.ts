import api from '../api/axios';

// Búsqueda de direcciones. La app nunca llama a Google: pasa por el backend
// (que guarda la clave de Google Maps y solo devuelve "Barrio, Ciudad").

export type PlaceSuggestion = { placeId: string; title: string; subtitle: string };
export type ResolvedPlace = { latitude: number; longitude: number; label: string };

/** Token de sesión: agrupa las búsquedas y el lugar elegido en un solo cobro de Google. */
export const newPlacesSession = () =>
  Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

export const placesService = {
  autocomplete: (input: string, session: string, near?: { latitude: number; longitude: number } | null) =>
    api
      .get<PlaceSuggestion[]>('/places/autocomplete', {
        params: { input, session, ...(near ? { lat: near.latitude, lng: near.longitude } : {}) },
      })
      .then(r => r.data),

  details: (placeId: string, session: string) =>
    api
      .get<ResolvedPlace>(`/places/details/${encodeURIComponent(placeId)}`, { params: { session } })
      .then(r => r.data),

  /** Ubicación actual -> "Barrio, Ciudad" ('' si Google no la reconoce). */
  reverse: (latitude: number, longitude: number) =>
    api.get<{ label: string }>('/places/reverse', { params: { lat: latitude, lng: longitude } }).then(r => r.data.label),
};

/** Mensaje para mostrar cuando falla una búsqueda. */
export const placesErrorMessage = (err: any) =>
  err?.response?.data?.message ||
  (err?.message === 'Network Error'
    ? 'Sin conexión. Revisa tu internet e intenta de nuevo.'
    : 'No se pudo buscar la dirección. Intenta de nuevo.');
