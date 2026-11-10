# Bart Web

Versión web y responsive de la app móvil de Bart (`../Bart`). Usa el mismo backend y las mismas reglas.

- **Stack:** Vite, React 19, TypeScript, React Router y Redux Toolkit.
- **Celular:** barra de pestañas abajo.
- **Escritorio:** menú arriba, cuadrícula de 3 o 4 columnas y detalle de producto en dos columnas.

## Correr en desarrollo

```bash
npm install
cp .env.example .env   # y ajustar las URLs
npm run dev            # http://localhost:5173 (también en la red local)
```

Variables en `.env`:

| Variable | Para qué sirve |
| --- | --- |
| `VITE_URL_BACKEND` | URL de la API, con `/api` (igual que `URL_BACKEND` en la app) |
| `VITE_URL_PRODUCCION` | Dominio de los enlaces que se comparten (`/p/<id>`) |

## Compilar para producción

```bash
npm run build   # genera dist/
```

`dist/` es un sitio estático. El servidor debe responder `index.html` en todas las rutas, porque es una SPA:

- **Netlify:** ya incluye `public/_redirects`.
- **Vercel, Nginx u otros:** hay que configurar una regla equivalente.

## Qué se reutiliza de la app móvil

`src/redux` (slices, servicios y tipos), `src/constants` y `src/utils/currency|favorites` se copiaron casi sin cambios. Al modificar la lógica de negocio, conviene hacer el mismo cambio en los dos proyectos.

## Diferencias con la app móvil

| App móvil | Web |
| --- | --- |
| AsyncStorage | `localStorage` |
| `Alert.alert` | `showAlert` (`src/utils/dialog.ts`), con la misma firma |
| Notificaciones push (FCM) | No hay. Los avisos se ven en la campanita, que se actualiza cada minuto. Las preferencias se siguen guardando para la app. |
| Selector de número de la SIM (Android) | No existe. El número de WhatsApp se escribe a mano. |
| Galería del teléfono | `<input type="file">`. Las fotos se reducen en el navegador antes de subirlas a Cloudinary. |
| Menú nativo de compartir | WhatsApp, Facebook, Telegram, X, "Copiar enlace" y el menú del sistema si el navegador lo tiene. |
| Botón "Comprar o intercambiar" (no hacía nada) | Se quitó. El dueño ve "Editar producto" en el detalle. |
