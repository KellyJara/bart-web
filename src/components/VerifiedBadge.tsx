import { isVerifiedUser } from '../utils/levels';

type Props = {
  points?: number | null;
  /** compact: solo el ✔ (junto a un nombre); si no, la etiqueta "✔ Verificado" */
  compact?: boolean;
};

/** Insignia de usuario verificado (1000 puntos o más). No muestra nada si no lo es. */
const VerifiedBadge = ({ points, compact }: Props) => {
  if (!isVerifiedUser(points)) return null;
  return compact ? (
    <span
      title="Usuario verificado"
      aria-label="Usuario verificado"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        marginLeft: 6,
        borderRadius: '50%',
        background: 'var(--success)',
        color: 'var(--white)',
        fontSize: 11,
        fontWeight: 800,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      ✔
    </span>
  ) : (
    <span
      aria-label="Usuario verificado"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(106, 142, 35, 0.14)',
        color: 'var(--success)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      ✔ Verificado
    </span>
  );
};

export default VerifiedBadge;
