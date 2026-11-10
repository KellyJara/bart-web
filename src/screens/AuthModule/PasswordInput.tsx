import { InputHTMLAttributes, useState } from 'react';
import '../../styles/profile.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean };

/** Campo de contraseña con botón para mostrarla u ocultarla (equivale a secureToggle de la app). */
const PasswordInput = ({ invalid, className, ...props }: Props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        className={`input${invalid ? ' input--error' : ''}${className ? ` ${className}` : ''}`}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
};

export default PasswordInput;
