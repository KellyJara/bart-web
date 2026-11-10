import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearAuthError, signup } from '../../redux/slices/auth/authSlice';
import { cleanPhoneInput, formatPhoneInput, isColombianMobile } from '../../utils/whatsapp';
import { isStrongPassword } from '../../utils/password';
import { Spinner } from '../../components/ui';
import PasswordStrength from '../../components/PasswordStrength';
import PasswordInput from './PasswordInput';
import '../../styles/profile.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector(state => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // solo los 10 dígitos del celular
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const phoneIsValid = isColombianMobile(phone);
  const passwordOk = isStrongPassword(password);

  // Campos que faltan o no son válidos. El botón solo se activa cuando no falta nada.
  const missingFields = [
    !username.trim() && 'nombre de usuario',
    !emailValid && 'correo válido',
    !phoneIsValid && 'WhatsApp',
    !passwordOk && 'contraseña segura',
  ].filter(Boolean) as string[];
  const canSubmit = missingFields.length === 0 && !loading;

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const res = await dispatch(
        signup({ username: username.trim(), email: email.trim(), whatsapp: `57${phone}`, password }),
      ).unwrap();
      // Falta verificar el correo con el PIN. Al verificarlo queda con sesión iniciada
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`);
    } catch {
      // el error se muestra desde el estado de auth
    }
  };

  const phoneError = !!phone && !phoneIsValid ? 'Celular de Colombia: 10 dígitos que empiezan por 3' : null;

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSignUp} noValidate>
        <div className="auth__brand">Bart</div>
        <div className="auth__emoji" aria-hidden>✨</div>
        <h1 className="auth__title">Crear cuenta</h1>
        <p className="auth__subtitle">Únete a Bart para publicar tus productos y contactar vendedores.</p>

        <div className="form-field">
          <label className="label" htmlFor="signup-username">Nombre de usuario</label>
          <input
            id="signup-username"
            className="input"
            placeholder="Cómo te verán los demás"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label" htmlFor="signup-email">Correo electrónico</label>
          <input
            id="signup-email"
            className={`input${email && !emailValid ? ' input--error' : ''}`}
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {!!email && !emailValid && <p className="error-text">Correo inválido</p>}
        </div>

        {/* WhatsApp: los compradores lo usan para escribirte (no se verifica) */}
        <div className="form-field">
          <label className="label" htmlFor="signup-phone">WhatsApp</label>
          <div className="phone-row">
            <span className="phone-row__prefix">🇨🇴 +57</span>
            <input
              id="signup-phone"
              className={`input${phoneError ? ' input--error' : ''}`}
              value={formatPhoneInput(phone)}
              onChange={e => setPhone(cleanPhoneInput(e.target.value))}
              type="tel"
              inputMode="tel"
              placeholder="320 745 2694"
              autoComplete="tel-national"
            />
          </div>
          {phoneError ? (
            <p className="error-text">{phoneError}</p>
          ) : (
            <p className="hint">Los compradores te escribirán a este número</p>
          )}
        </div>

        <div className="form-field">
          <label className="label" htmlFor="signup-password">Contraseña</label>
          <PasswordInput
            id="signup-password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <PasswordStrength password={password} />
        </div>

        {error && <p className="banner banner--error" role="alert">⚠️ {error}</p>}

        {/* Qué falta para poder registrarse */}
        {missingFields.length > 0 && (
          <p className="auth__missing">Para registrarte falta: {missingFields.join(', ')}</p>
        )}

        {/* Desactivado hasta llenar todo el formulario */}
        <button type="submit" className="btn btn--block" disabled={!canSubmit}>
          {loading ? <Spinner small /> : 'Registrarse'}
        </button>

        <div className="auth__footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión</Link>
          </p>
          <Link to="/" className="link">Seguir viendo productos</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUpScreen;
