import { getPasswordScore, getPasswordStrengthLabel } from '../utils/password';
import '../styles/profile.css';

const SEGMENTS = 4;

/** Medidor de seguridad de la contraseña (4 segmentos + texto). No muestra nada si está vacía. */
const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const score = getPasswordScore(password);
  const tone = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';

  return (
    <div className={`pw-strength pw-strength--${tone}`} aria-live="polite">
      <div className="pw-strength__track" aria-hidden>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span key={i} className={`pw-strength__segment${i < score ? ' pw-strength__segment--on' : ''}`} />
        ))}
      </div>
      <span className="pw-strength__label">{getPasswordStrengthLabel(password)}</span>
    </div>
  );
};

export default PasswordStrength;
