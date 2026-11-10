// Puntos y niveles (iguales al backend: Bart-backend/src/libs/points.js)
//  - +50 puntos por cada venta o regalo, cuando la otra persona deja su reseña.
//  - Con 1000 puntos se alcanza el nivel "Usuario verificado".
export const REVIEW_POINTS = 50;
export const VERIFIED_POINTS = 1000;

export const isVerifiedUser = (points?: number | null) => (points ?? 0) >= VERIFIED_POINTS;

/** Cuántos puntos faltan para ser verificado (0 si ya lo es). */
export const pointsToVerified = (points?: number | null) => Math.max(VERIFIED_POINTS - (points ?? 0), 0);
