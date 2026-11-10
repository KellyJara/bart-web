import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/slices/auth/authSlice';
import { selectIsAdmin, selectIsConnected } from '../redux/slices/auth/authSelectors';
import { getUserProfileThunk } from '../redux/slices/user/user';
import { fetchFavorites } from '../redux/slices/favorite/favoriteSlice';
import { fetchUnreadCount } from '../redux/slices/inbox/inboxSlice';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '../redux/slices/notification/notificationSlice';
import { requestLogin } from '../utils/authGate';
import { showAlert } from '../utils/dialog';
import { Avatar } from './ui';

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/**
 * Campanita del encabezado con el número de avisos sin leer.
 * Solo aparece con sesión iniciada.
 */
const NotificationBell = () => {
  const unread = useAppSelector(state => state.inbox.unreadCount);
  return (
    <NavLink
      to="/notifications"
      className="icon-btn"
      aria-label={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
    >
      <BellIcon />
      {unread > 0 && <span className="icon-btn__badge">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  );
};

// Pestañas que requieren sesión: sin sesión piden iniciarla primero.
// Los administradores ven el informe en lugar de Mis productos y Postulaciones (igual que en la app).
const HOME = { to: '/', label: 'Inicio', icon: '🏠', protected: false };
const USER_NAV = [
  HOME,
  { to: '/my-products', label: 'Mis productos', icon: '🛍️', protected: true },
  { to: '/my-contacts', label: 'Postulaciones', icon: '📋', protected: true },
];
const ADMIN_NAV = [HOME, { to: '/admin/report', label: 'Informe', icon: '📊', protected: true }];

/** Datos que se mantienen al día mientras hay sesión (en la app móvil están en App.tsx). */
const useSessionSync = () => {
  const dispatch = useAppDispatch();
  const isConnected = useAppSelector(selectIsConnected);
  const coords = useAppSelector(state => state.location.coords);
  const nearbyNotifications = useAppSelector(state => state.notifications.settings?.nearbyProducts);

  useEffect(() => {
    if (!isConnected) return;
    dispatch(getUserProfileThunk());
    dispatch(fetchFavorites());
    dispatch(fetchNotificationSettings());
  }, [dispatch, isConnected]);

  // Campanita: actualizar el número al iniciar sesión, al volver a la pestaña y cada minuto
  useEffect(() => {
    if (!isConnected) return;
    const refreshBell = () => dispatch(fetchUnreadCount());
    refreshBell();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshBell();
    }, 60 * 1000);
    const onVisible = () => document.visibilityState === 'visible' && refreshBell();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch, isConnected]);

  // Mantener actualizada la ubicación aproximada solo si pidió avisos de productos cerca
  useEffect(() => {
    if (isConnected && nearbyNotifications && coords) {
      dispatch(updateNotificationSettings({ location: coords }));
    }
  }, [dispatch, isConnected, nearbyNotifications, coords]);
};

const Layout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isConnected = useAppSelector(selectIsConnected);
  const user = useAppSelector(state => state.user.currentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const NAV = isAdmin ? ADMIN_NAV : USER_NAV;

  useSessionSync();

  // Cada página nueva empieza arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const onProtectedClick = (e: React.MouseEvent, to: string) => {
    if (isConnected) return;
    e.preventDefault();
    requestLogin(navigate, () => navigate(to));
  };

  const confirmLogout = () =>
    showAlert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          // Se queda en la página como invitado
          dispatch(logout());
          navigate('/');
        },
      },
    ]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand">Bart</NavLink>

          <nav className="topbar__nav" aria-label="Principal">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className="topbar__link"
                onClick={e => item.protected && onProtectedClick(e, item.to)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar__right">
            {isConnected ? (
              <>
                <NotificationBell />
                <NavLink to="/profile" className="profile-chip">
                  <Avatar src={user?.profileImg} size={34} />
                  <span className="hide-mobile">{user?.username ?? 'Mi perfil'}</span>
                </NavLink>
                <button type="button" className="link link--danger hide-mobile" style={{ padding: '0 6px' }} onClick={confirmLogout}>
                  Salir
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--sm" onClick={() => requestLogin(navigate)}>
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Principal">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="bottom-nav__item"
            onClick={e => item.protected && onProtectedClick(e, item.to)}
          >
            <span className="bottom-nav__icon" aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/profile" className="bottom-nav__item" onClick={e => onProtectedClick(e, '/profile')}>
          <span className="bottom-nav__icon" aria-hidden>👤</span>
          Perfil
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
