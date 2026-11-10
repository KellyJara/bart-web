import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { updateUserThunk } from '../../redux/slices/user/user';
import { fetchFavoriteProducts, toggleFavorite } from '../../redux/slices/favorite/favoriteSlice';
import { logout } from '../../redux/slices/auth/authSlice';
import { cleanPhoneInput, formatPhoneInput, isColombianMobile, toLocalPhone } from '../../utils/whatsapp';
import { uploadImage, getUploadErrorMessage } from '../../utils/uploadImage';
import { getPriceLabel } from '../../utils/productPrice';
import { isVerifiedUser, pointsToVerified, REVIEW_POINTS, VERIFIED_POINTS } from '../../utils/levels';
import { DEFAULT_AVATAR_URL } from '../../utils/format';
import { showAlert } from '../../utils/dialog';
import { Avatar, PageLoader, Spinner } from '../../components/ui';
import VerifiedBadge from '../../components/VerifiedBadge';
import '../../styles/profile.css';

const ABOUT_ME_MAX = 200;

const EditProfileScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(state => state.user.currentUser);
  const loading = useAppSelector(state => state.user.loading);
  // Favoritos: se piden al servidor (no dependen de los productos cargados en el inicio)
  const favoriteProducts = useAppSelector(state => state.favorite.products);
  const favoritesLoading = useAppSelector(state => state.favorite.productsLoading);

  const [profileImage, setProfileImage] = useState<string>(user?.profileImg || DEFAULT_AVATAR_URL);
  const [aboutMe, setAboutMe] = useState<string>(user?.aboutMe || '');
  // WhatsApp para que los compradores te contacten (no se verifica): solo los 10 dígitos
  const savedPhone = toLocalPhone(user?.whatsapp);
  const [phone, setPhone] = useState<string>(savedPhone);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Si se abre la página directamente, el perfil llega después del primer render
  const filled = useRef(!!user);
  useEffect(() => {
    if (user && !filled.current) {
      filled.current = true;
      setProfileImage(user.profileImg || DEFAULT_AVATAR_URL);
      setAboutMe(user.aboutMe || '');
      setPhone(toLocalPhone(user.whatsapp));
    }
  }, [user]);

  // Recargar la lista cada vez que se entra (pudo marcar otros en el inicio)
  useEffect(() => {
    dispatch(fetchFavoriteProducts());
  }, [dispatch]);

  const phoneChanged = phone !== savedPhone;
  // Vacío solo se permite si nunca tuvo número; si escribe algo, debe ser un celular válido
  const phoneError =
    phoneChanged && !isColombianMobile(phone)
      ? phone
        ? 'Celular de Colombia: 10 dígitos que empiezan por 3'
        : 'El WhatsApp es obligatorio'
      : null;

  // Subir a Cloudinary (con moderación de contenido) antes de usarla
  const pickImage = (file?: File) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setUploading(true);
    uploadImage(file, { maxSide: 400 })
      .then(url => setProfileImage(url))
      .catch(err => {
        console.log(err);
        showAlert('Error', getUploadErrorMessage(err));
      })
      .finally(() => setUploading(false));
  };

  const saveProfile = async () => {
    if (!user || phoneError) return;
    try {
      await dispatch(
        updateUserThunk({
          userId: user._id,
          data: {
            // El avatar por defecto no se guarda (no está en Cloudinary)
            profileImg: profileImage === DEFAULT_AVATAR_URL ? undefined : profileImage,
            aboutMe,
            // Solo se envía si cambió; el backend lo guarda como 573XXXXXXXXX
            ...(phoneChanged ? { whatsapp: `57${phone}` } : {}),
          },
        }),
      ).unwrap();
      showAlert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      showAlert('Error', typeof error === 'string' ? error : 'No se pudo actualizar el perfil');
    }
  };

  const confirmLogout = () =>
    showAlert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          // Se queda en Bart como invitado
          dispatch(logout());
          navigate('/');
        },
      },
    ]);

  if (!user) return <PageLoader />;

  const points = user.points ?? 0;
  const canSave = !loading && !uploading && !phoneError;

  const settings = [
    {
      icon: '🔑',
      label: 'Cambiar contraseña',
      description: 'Te pediremos la actual por seguridad',
      to: '/profile/password',
    },
    {
      icon: '🔔',
      label: 'Notificaciones',
      description: 'Elige qué avisos quieres recibir',
      to: '/settings/notifications',
    },
    {
      icon: '🛟',
      label: 'Ayuda y reportes',
      description: 'Escríbenos si algo no funciona',
      to: '/support',
    },
    {
      icon: '👀',
      label: 'Ver mi perfil público',
      description: 'Así te ven los demás',
      to: `/seller/${user._id}`,
    },
    {
      icon: '⭐',
      label: 'Mis reseñas como vendedor',
      description: 'Lo que dicen quienes te compraron',
      to: `/seller/${user._id}/reviews`,
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title grow">Mi perfil</h1>
        {/* "Salir" (en la app está en el encabezado, junto a la campanita) */}
        <button type="button" className="btn btn--outline btn--sm" onClick={confirmLogout} aria-label="Cerrar sesión">
          Salir
        </button>
      </div>

      <div className="profile-layout">
        <aside className="profile-layout__aside stack" style={{ gap: 16 }}>
          {/* ---------- CABECERA: foto, nombre y puntos ---------- */}
          <div className="card profile-head" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className="avatar-picker"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Cambiar foto"
            >
              <Avatar src={profileImage} size={110} ring />
              {uploading && (
                <span className="avatar-picker__overlay"><Spinner small /></span>
              )}
              <span className="avatar-picker__badge" aria-hidden>📷</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => pickImage(e.target.files?.[0])} />

            <p className="profile-head__name">{user.username}</p>
            <p className="meta">{user.email}</p>

            {/* Puntos y nivel: +50 por cada reseña recibida (venta o regalo); con 1000 eres usuario verificado */}
            <span className="points-chip">🏅 {points} puntos</span>
            {isVerifiedUser(points) ? (
              <VerifiedBadge points={points} />
            ) : (
              <div className="level-box">
                <div
                  className="level-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={VERIFIED_POINTS}
                  aria-valuenow={points}
                >
                  <div className="level-fill" style={{ width: `${Math.min((points / VERIFIED_POINTS) * 100, 100)}%` }} />
                </div>
                <p className="level-text">
                  Te faltan {pointsToVerified(points)} puntos para ser ✔ usuario verificado
                </p>
              </div>
            )}
            <p className="hint">
              Ganas {REVIEW_POINTS} puntos cada vez que alguien a quien le vendiste o regalaste un producto te deja una reseña.
            </p>
          </div>

          {/* ---------- INFORMACIÓN ---------- */}
          <div className="card stack" style={{ gap: 14 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Tu información</h2>

            <div className="form-field">
              <label className="label" htmlFor="aboutMe">Sobre mí</label>
              <textarea
                id="aboutMe"
                className="textarea"
                style={{ minHeight: 80 }}
                value={aboutMe}
                maxLength={ABOUT_ME_MAX}
                onChange={e => setAboutMe(e.target.value)}
                placeholder="Cuéntales a los demás quién eres"
              />
              <div className="row row--between">
                <span className="hint">Aparece en tu perfil de vendedor.</span>
                <span className="char-counter">{aboutMe.length}/{ABOUT_ME_MAX}</span>
              </div>
            </div>

            {/* WhatsApp: se puede cambiar sin verificarlo */}
            <div className="form-field">
              <label className="label" htmlFor="profile-phone">WhatsApp</label>
              <div className="phone-row">
                <span className="phone-row__prefix">🇨🇴 +57</span>
                <input
                  id="profile-phone"
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
                <p className="hint">
                  Los compradores lo usan para escribirte. Solo lo ven personas con sesión iniciada al tocar "Contactar".
                </p>
              )}
            </div>

            <button type="button" className="btn btn--block" onClick={saveProfile} disabled={!canSave}>
              {loading ? <Spinner small /> : uploading ? 'Subiendo foto...' : 'Guardar cambios'}
            </button>
          </div>

          {/* ---------- AJUSTES ---------- */}
          <nav className="menu-list" aria-label="Ajustes">
            {settings.map(item => (
              <button key={item.label} type="button" className="menu-list__item" onClick={() => navigate(item.to)}>
                <span className="row">
                  <span aria-hidden>{item.icon}</span>
                  <span className="menu-list__text">
                    <span>{item.label}</span>
                    <span className="menu-list__subtitle">{item.description}</span>
                  </span>
                </span>
                <span aria-hidden>›</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ---------- FAVORITOS ---------- */}
        <section>
          <h2 className="section-title">
            Mis favoritos
            {favoriteProducts.length > 0 && <span className="section-count">{favoriteProducts.length}</span>}
          </h2>
          <div className="card card--white">
            {favoriteProducts.length === 0 && favoritesLoading ? (
              <div className="row" style={{ justifyContent: 'center', padding: 16 }}><Spinner /></div>
            ) : favoriteProducts.length === 0 ? (
              <p className="empty" style={{ padding: '24px 12px' }}>
                <span style={{ fontSize: 32 }}>🤍</span><br />
                <strong style={{ color: 'var(--text)' }}>Aún no tienes favoritos</strong><br />
                Guarda los productos que te gusten para verlos aquí.
              </p>
            ) : (
              <div className="fav-list">
                {favoriteProducts.map(item => (
                  <div key={item._id} className="fav-row">
                    {/* Tocar el producto abre su detalle */}
                    <button type="button" className="fav-row__open" onClick={() => navigate(`/product/${item._id}`)}>
                      <img src={item.images?.[0] || item.imgURL} alt="" className="thumb thumb--sm" />
                      <span className="grow">
                        <span className="ellipsis" style={{ display: 'block', fontWeight: 600 }}>{item.name}</span>
                        <span className="price">{getPriceLabel(item)}</span>
                      </span>
                    </button>
                    {/* Corazón rojo: tocarlo lo quita de favoritos */}
                    <button
                      type="button"
                      className="fav-row__heart"
                      onClick={() => dispatch(toggleFavorite(item._id))}
                      aria-label={`Quitar ${item.name} de favoritos`}
                      title="Quitar de favoritos"
                    >
                      ❤️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditProfileScreen;
