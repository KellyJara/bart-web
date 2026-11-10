import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearAuthError, login } from '../../redux/slices/auth/authSlice';
import { selectIsConnected } from '../../redux/slices/auth/authSelectors';
import { EMAIL_NOT_VERIFIED } from '../../redux/types/auth.types';
import { completeLogin } from '../../utils/authGate';
import { Spinner } from '../../components/ui';
import PasswordInput from './PasswordInput';
import '../../styles/profile.css';

const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector(state => state.auth);
  const isConnected = useAppSelector(selectIsConnected);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Con sesión iniciada se vuelve a la página donde estaba el usuario
  useEffect(() => {
    if (isConnected) completeLogin(navigate);
  }, [isConnected, navigate]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    dispatch(login({ email: email.trim(), password }))
      .unwrap()
      .catch(err => {
        // Cuenta sin verificar: el backend ya envió un PIN al correo
        if (err === EMAIL_NOT_VERIFIED) {
          navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }
      });
  };

  const forgotUrl = email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password';

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleLogin}>
        <div className="auth__brand">Bart</div>
        <div className="auth__emoji" aria-hidden>👋</div>
        <h1 className="auth__title">Inicia sesión</h1>
        <p className="auth__subtitle">Entra a tu cuenta de Bart para publicar, guardar favoritos y contactar vendedores.</p>

        <div className="form-field">
          <label className="label" htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            className="input"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="label" htmlFor="login-password">Contraseña</label>
          <PasswordInput
            id="login-password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {/* Olvidé mi contraseña: código al correo y contraseña nueva */}
        <Link to={forgotUrl} className="link auth__forgot">¿Olvidaste tu contraseña?</Link>

        {error && <p className="banner banner--error" role="alert">⚠️ {error}</p>}

        <button type="submit" className="btn btn--block" disabled={loading}>
          {loading ? <Spinner small /> : 'Entrar'}
        </button>

        <div className="auth__footer">
          <p>
            ¿No tienes cuenta? <Link to="/signup" className="link">Regístrate</Link>
          </p>
          <Link to="/" className="link">Seguir viendo productos</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
