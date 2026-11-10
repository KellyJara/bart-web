import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearAuthError, verifyEmail } from '../../redux/slices/auth/authSlice';
import api from '../../redux/api/axios';
import { completeLogin } from '../../utils/authGate';
import { Spinner } from '../../components/ui';
import '../../styles/profile.css';

const PIN_LENGTH = 6;
const RESEND_SECONDS = 60; // el backend permite un código por minuto
const RESEND_OK_MESSAGE = 'Te enviamos un código nuevo';

/**
 * Pantalla para ingresar el PIN que llegó al correo.
 * Al verificarlo queda con sesión iniciada y vuelve a donde estaba el usuario.
 */
const VerifyEmailScreen = () => {
  const navigate = useNavigate();
  const email = useSearchParams()[0].get('email') ?? '';
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);

  const [pin, setPin] = useState('');
  // Se acaba de enviar un código al llegar a esta pantalla
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Cuenta regresiva para poder pedir otro código
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  if (!email) return <Navigate to="/login" replace />;

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH || loading) return;
    setResendMessage(null);
    dispatch(verifyEmail({ email, pin }))
      .unwrap()
      // Correo verificado: queda con sesión iniciada
      .then(() => completeLogin(navigate))
      .catch(() => setPin('')); // el error se muestra desde el estado de auth
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      await api.post('/auth/resend-pin', { email });
      setResendMessage(RESEND_OK_MESSAGE);
      setResendIn(RESEND_SECONDS);
      setPin('');
    } catch (err: any) {
      setResendMessage(err?.response?.data?.message || 'No se pudo enviar el código');
      if (err?.response?.data?.retryAfter) setResendIn(err.response.data.retryAfter);
    } finally {
      setResending(false);
    }
  };

  const canResend = resendIn <= 0 && !resending;
  const resendOk = resendMessage === RESEND_OK_MESSAGE;

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleVerify}>
        <div className="auth__emoji" aria-hidden>📬</div>
        <h1 className="auth__title">Verifica tu correo</h1>
        <p className="auth__subtitle">
          Ingresa el código de 6 dígitos que enviamos a<br />
          <strong style={{ color: 'var(--text)' }}>{email}</strong>
        </p>

        <div className="form-field">
          <label className="label" htmlFor="verify-pin">Código de verificación</label>
          <input
            id="verify-pin"
            className="pin-input"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
            inputMode="numeric"
            maxLength={PIN_LENGTH}
            placeholder="------"
            autoFocus
            autoComplete="one-time-code"
          />
          {error && <p className="error-text" role="alert">{error}</p>}
        </div>

        <button type="submit" className="btn btn--block" disabled={pin.length !== PIN_LENGTH || loading}>
          {loading ? <Spinner small /> : 'Verificar'}
        </button>

        <div className="auth__footer">
          <button type="button" className="link" onClick={handleResend} disabled={!canResend}>
            {resending
              ? 'Enviando...'
              : resendIn > 0
                ? `Reenviar código en ${resendIn} s`
                : '¿No te llegó? Reenviar código'}
          </button>
          {resendMessage && (
            <p className={resendOk ? 'info-text' : 'error-text'}>
              {resendOk ? '✅' : '⚠️'} {resendMessage}
            </p>
          )}
          <p className="hint">Revisa también la carpeta de spam.</p>
          <button
            type="button"
            className="link"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/login'))}
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerifyEmailScreen;
