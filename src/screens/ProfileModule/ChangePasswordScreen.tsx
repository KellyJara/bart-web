import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordErrorCode, userService } from '../../redux/services/userService';
import { useAppSelector } from '../../redux/hooks';
import { isStrongPassword } from '../../utils/password';
import { showAlert } from '../../utils/dialog';
import { BackButton, Spinner } from '../../components/ui';
import PasswordStrength from '../../components/PasswordStrength';
import PasswordInput from '../AuthModule/PasswordInput';
import '../../styles/profile.css';

/**
 * Cambiar la contraseña desde el perfil. Pide la actual (el backend la comprueba)
 * y una nueva segura, escrita dos veces.
 */
const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  const email = useAppSelector(state => state.user.currentUser?.email ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  // Error de la contraseña actual (incorrecta) o error general del servidor
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const newIsStrong = isStrongPassword(newPassword);
  const sameAsCurrent = !!newPassword && newPassword === currentPassword;
  const confirmMismatch = !!confirmPassword && confirmPassword !== newPassword;

  // Qué falta. El botón solo se activa cuando no falta nada.
  const missingFields = [
    !currentPassword && 'contraseña actual',
    !newIsStrong && 'nueva contraseña segura',
    sameAsCurrent && 'que la nueva sea diferente',
    (!confirmPassword || confirmMismatch) && 'confirmar la nueva',
  ].filter(Boolean) as string[];
  const canSubmit = missingFields.length === 0 && !saving;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setCurrentError(null);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      showAlert('Listo', 'Tu contraseña se cambió correctamente');
      navigate('/profile', { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      const code = data?.code as ChangePasswordErrorCode | undefined;
      const message = data?.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.';
      if (code === 'WRONG_PASSWORD') {
        setCurrentError(message);
        setCurrentPassword('');
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Cambiar contraseña</h1>

      <p className="banner">🔒 Por seguridad, primero escribe tu contraseña actual.</p>

      <form className="stack" style={{ gap: 14 }} onSubmit={handleSave}>
        <div className="card stack" style={{ gap: 14 }}>
          {/* Para que el navegador asocie la contraseña a la cuenta */}
          <input type="email" value={email} autoComplete="username" readOnly hidden />

          <div className="form-field">
            <label className="label" htmlFor="cp-current">Contraseña actual</label>
            <PasswordInput
              id="cp-current"
              autoComplete="current-password"
              value={currentPassword}
              onChange={e => {
                setCurrentPassword(e.target.value);
                setCurrentError(null);
              }}
              invalid={!!currentError}
            />
            {currentError && <p className="error-text" role="alert">{currentError}</p>}
          </div>

          <div className="form-field">
            <label className="label" htmlFor="cp-new">Nueva contraseña</label>
            <PasswordInput
              id="cp-new"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              invalid={sameAsCurrent}
            />
            {sameAsCurrent && <p className="error-text">Debe ser diferente a la actual</p>}
            <PasswordStrength password={newPassword} />
          </div>

          <div className="form-field">
            <label className="label" htmlFor="cp-confirm">Confirmar nueva contraseña</label>
            <PasswordInput
              id="cp-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              invalid={confirmMismatch}
            />
            {confirmMismatch && <p className="error-text">Las contraseñas no coinciden</p>}
          </div>
        </div>

        {error && <p className="banner banner--error" role="alert">⚠️ {error}</p>}

        {/* Desactivado hasta llenar todo */}
        {missingFields.length > 0 && <p className="hint">Falta: {missingFields.join(', ')}</p>}
        <button type="submit" className="btn btn--block" disabled={!canSubmit}>
          {saving ? <Spinner small /> : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordScreen;
