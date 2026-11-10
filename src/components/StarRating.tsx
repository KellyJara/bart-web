import { SellerRating } from '../redux/types/review.type';

const STAR_COLOR = 'var(--star)';
const EMPTY_COLOR = 'var(--surface-2)';

type StarsProps = {
  value: number; // 0 a 5 (puede tener decimales al mostrar promedios)
  size?: number;
  onChange?: (value: number) => void; // si se pasa, las estrellas se pueden tocar
};

/**
 * Estrellas de 1 a 5. Solo lectura, o para elegir si se pasa onChange.
 */
export const Stars = ({ value, size = 18, onChange }: StarsProps) => (
  <span className="stars" aria-label={onChange ? undefined : `${value.toFixed(1)} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map(star => {
      const filled = value >= star - 0.25; // 4.8 -> 5 llenas; 4.5 -> 4.5 se ve como 5
      const text = (
        <span style={{ fontSize: size, color: filled ? STAR_COLOR : EMPTY_COLOR, marginRight: size * 0.1 }}>★</span>
      );
      return onChange ? (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
        >
          {text}
        </button>
      ) : (
        <span key={star} aria-hidden>{text}</span>
      );
    })}
  </span>
);

type BadgeProps = {
  rating?: SellerRating | null;
  showEmpty?: boolean; // mostrar "Sin calificaciones" si no tiene reseñas
};

/**
 * Resumen compacto: "★ 4.8 (12 reseñas)".
 */
export const SellerRatingBadge = ({ rating, showEmpty = true }: BadgeProps) => {
  if (!rating?.count) {
    return showEmpty ? <span className="meta">Sin calificaciones todavía</span> : null;
  }
  return (
    <span style={{ fontSize: 14 }}>
      <span style={{ color: STAR_COLOR }}>★ </span>
      <strong>{rating.average.toFixed(1)}</strong>
      <span className="meta">
        {' '}({rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'})
      </span>
    </span>
  );
};
