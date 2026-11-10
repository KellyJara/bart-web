import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../redux/api/axios';
import { useAppDispatch } from '../../redux/hooks';
import { resetPassword } from '../../redux/slices/auth/authSlice';
import { isStrongPassword } from '../../utils/password';
import { completeLogin } from '../../utils/authGate';
import { Spinner } from '../../components/ui';
import PasswordStrength from '../../components/PasswordStrength';
import PasswordInput from './PasswordInput';
import '../../styles/profile.css';

type Step = 'email' | 'code' | 'password';

const PIN_LENGTH = 6;
const RESEND_SECONDS = 60; // el backend permite un código por minuto
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const apiMessage = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (err?.message === 'Network Error' ? 'Sin conexión. Revisa tu internet e intenta de nuevo.' : fallback);

const HEADERS: Record<Step, { emoji: string; title: string; subtitle: string }> = {
  email: {
    emoji: '🔑',
    title: '¿Olvidaste tu contraseña?',
    subtitle: 'Escribe el correo de tu cuenta y te enviaremos un código para crear una nueva.',
  },
  code: { emoji: '📬', title: 'Revisa tu correo', subtitle: '' },
  password: {
    emoji: '🔒',
    title: 'Crea tu nueva contraseña',
    subtitle: 'Usa una contraseña segura que no hayas usado antes.',
  },
};

/**
 * "Olvidé mi contraseña":
 * 1. Escribe su correo -> le llega un código de 6 dígitos.
 * 2. Escribe el código -> si coincide, puede poner una contraseña nueva.
 * 3. Contraseña nueva -> queda con sesión iniciada y vuelve a donde estaba.
 */
const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const initialEmail = useSearchParams()[0].get('email') ?? '';
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail.trim());
  const [pin, setPin] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Cuenta regresiva para poder pedir otro código
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_REGEX.test(normalizedEmail);

  /* ---------- 1. Enviar código ---------- */
  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!emailValid || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setInfo(res.data?.message ?? 'Te enviamos un código a tu correo.');
      setStep('code');
      setPin('');
      setResendIn(RESEND_SECONDS);
    } catch (err: any) {
      const retryAfter = err?.response?.data?.retryAfter;
      if (retryAfter) {
        // Ya se envió uno hace poco: puede usar ese
        setStep('code');
        setResendIn(retryAfter);
        setInfo('Ya te enviamos un código hace poco. Revisa tu correo.');
      } else {
        setError(apiMessage(err, 'No se pudo enviar el código. Intenta de nuevo.'));
      }
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 2. Verificar código ---------- */
  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ resetToken: string }>('/auth/verify-reset-code', {
        email: normalizedEmail,
        pin,
      });
      setResetToken(res.data.resetToken);
      setInfo(null);
      setStep('password');
    } catch (err) {
      setError(apiMessage(err, 'No se pudo verificar el código.'));
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 3. Contraseña nueva ---------- */
  const strong = isStrongPassword(newPassword);
  const mismatch = !!confirmPassword && confirmPassword !== newPassword;
  const canSave = strong && !!confirmPassword && !mismatch && !busy;

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      // Queda con sesión iniciada: vuelve a la página donde estaba el usuario
      await dispatch(resetPassword({ resetToken, newPassword })).unwrap();
      completeLogin(navigate);
    } catch (message) {
      setError(typeof message === 'string' ? message : 'No se pudo cambiar la contraseña.');
      // Si el permiso venció, hay que pedir otro código
      if (typeof message === 'string' && /venci|ya se us|Vuelve a pedir/i.test(message)) {
        setStep('email');
        setResetToken('');
      }
    } finally {
      setBusy(false);
    }
  };

  // Volver: al paso anterior o a la página anterior (el Login)
  const goBack = () => {
    setError(null);
    if (step === 'code') setStep('email');
    else if (window.history.length > 1) navigate(-1);
    else navigate('/login');
  };

  const header = HEADERS[step];

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__topbar">
          <button type="button" className="auth__icon-btn" onClick={goBack} aria-label="Volver">←</button>
        </div>

        <div className="auth__emoji" aria-hidden>{header.emoji}</div>
        <h1 className="auth__title">{header.title}</h1>
        {step === 'code' ? (
          <p className="auth__subtitle">
            Ingresa el código de 6 dígitos que enviamos a<br />
            <strong style={{ color: 'var(--text)' }}>{normalizedEmail}</strong>
          </p>
        ) : (
          <p className="auth__subtitle">{header.subtitle}</p>
        )}

        {/* ---------- Paso 1: correo ---------- */}
        {step === 'email' && (
          <form className="stack" style={{ gap: 14 }} onSubmit={sendCode} noValidate>
            <div className="form-field">
              <label className="label" htmlFor="forgot-email">Correo electrónico</label>
              <input
                id="forgot-email"
                className={`input${email && !emailValid ? ' input--error' : ''}`}
                type="email"
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError(null);
                }}
              />
              {!!email && !emailValid && <p className="error-text">Correo inválido</p>}
            </div>
            {error && <p className="banner banner--error" role="alert">⚠️ {error}</p>}
            <button type="submit" className="btn btn--block" disabled={!emailValid || busy}>
              {busy ? <Spinner small /> : 'Enviar código'}
            </button>
          </form>
        )}

        {/* ---------- Paso 2: código ---------- */}
        {step === 'code' && (
          <form className="stack" style={{ gap: 14 }} onSubmit={verifyCode}>
            <div className="form-field">
              <label className="label" htmlFor="forgot-pin">Código</label>
              <input
                id="forgot-pin"
                className="pin-input"
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
                  setError(null);
                }}
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                placeholder="------"
                autoFocus
                autoComplete="one-time-code"
              />
              {error && <p className="error-text" role="alert">{error}</p>}
            </div>
            {!!info && !error && <p className="info-text">✉️ {info}</p>}
            <button type="submit" className="btn btn--block" disabled={pin.length !== PIN_LENGTH || busy}>
              {busy ? <Spinner small /> : 'Verificar código'}
            </button>
            <div className="auth__footer">
              <button type="button" className="link" onClick={() => sendCode()} disabled={resendIn > 0 || busy}>
                {resendIn > 0 ? `Reenviar código en ${resendIn} s` : '¿No te llegó? Reenviar código'}
              </button>
              <p className="hint">Revisa también la carpeta de spam o correo no deseado.</p>
            </div>
          </form>
        )}

        {/* ---------- Paso 3: contraseña nueva ---------- */}
        {step === 'password' && (
          <form className="stack" style={{ gap: 14 }} onSubmit={savePassword}>
            {/* Campo oculto para que el navegador asocie la contraseña nueva al correo */}
            <input type="email" value={normalizedEmail} autoComplete="username" readOnly hidden />
            <div className="form-field">
              <label className="label" htmlFor="forgot-new">Nueva contraseña</label>
              <PasswordInput
                id="forgot-new"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <PasswordStrength password={newPassword} />
            </div>
            <div className="form-field">
              <label className="label" htmlFor="forgot-confirm">Confirmar contraseña</label>
              <PasswordInput
                id="forgot-confirm"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                invalid={mismatch}
              />
              {mismatch && <p className="error-text">Las contraseñas no coinciden</p>}
            </div>
            {error && <p className="banner banner--error" role="alert">⚠️ {error}</p>}
            <button type="submit" className="btn btn--block" disabled={!canSave}>
              {busy ? <Spinner small /> : 'Guardar y entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
