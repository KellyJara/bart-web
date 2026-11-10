/** Corazón de favoritos: completamente relleno de rojo si es favorito; si no, solo el contorno. */
const HeartIcon = ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden
    fill={filled ? '#E53935' : 'none'}
    stroke={filled ? '#E53935' : '#1C1C1C'}
    strokeWidth="2"
    strokeLinejoin="round"
  >
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.1 8.4 3.2 4.5 7 4.5c2.1 0 3.6 1.1 5 2.9 1.4-1.8 2.9-2.9 5-2.9 3.8 0 5.9 3.9 4.5 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);

export default HeartIcon;
