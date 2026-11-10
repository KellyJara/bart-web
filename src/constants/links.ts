// Dominio de los enlaces que se comparten (producción, sin /api)
export const SHARE_BASE_URL = String(import.meta.env.VITE_URL_PRODUCCION ?? '').replace(/\/api\/?$/, '');

// https://<dominio>/p/<id>: abre la app en el producto (o la página web si no la tiene)
export const productShareUrl = (productId: string) => `${SHARE_BASE_URL}/p/${productId}`;
