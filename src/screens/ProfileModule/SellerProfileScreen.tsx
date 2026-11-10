import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { selectIsAdmin } from '../../redux/slices/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchOtherUserById, clearOtherUser, deleteUserThunk } from '../../redux/slices/otherUser/otherUser';
import ReportButton from '../../components/ReportButton';
import { getPriceLabel } from '../../utils/productPrice';
import { SellerRatingBadge } from '../../components/StarRating';
import ReviewCard from '../../components/ReviewCard';
import { reviewService } from '../../redux/services/reviewService';
import { Review } from '../../redux/types/review.type';
import { buildContactMessage, contactSellerOnWhatsApp } from '../../utils/whatsapp';
import { requestLogin } from '../../utils/authGate';
import { showAlert } from '../../utils/dialog';
import { Avatar, BackButton, PageLoader } from '../../components/ui';
import VerifiedBadge from '../../components/VerifiedBadge';
import '../../styles/profile.css';

const SellerProfileScreen = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sellerId = '' } = useParams();
  const isAdmin = useAppSelector(selectIsAdmin);
  const userId = useAppSelector(state => state.auth.userId);

  const { user, products, loading, error } = useAppSelector(state => state.otherUser);

  // Últimas reseñas del vendedor (las demás en "Ver todas")
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  useEffect(() => {
    reviewService.getSellerReviews(sellerId)
      .then(res => setLatestReviews(res.data.reviews.slice(0, 2)))
      .catch(err => console.log('Error cargando reseñas:', err));
  }, [sellerId]);

  useEffect(() => {
    dispatch(fetchOtherUserById(sellerId));
    return () => {
      dispatch(clearOtherUser());
    };
  }, [dispatch, sellerId]);

  if (loading) return <PageLoader />;

  if (error || !user) {
    return (
      <div className="center">
        <p style={{ fontSize: 16, fontWeight: 700 }}>😕 No se pudo cargar el perfil</p>
        {error && <p className="error-text">{error}</p>}
        <BackButton />
      </div>
    );
  }

  const handleDeleteUser = () =>
    showAlert('Eliminar usuario', `¿Eliminar la cuenta de ${user.username}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteUserThunk(user._id)).unwrap();
            showAlert('Éxito', 'Usuario eliminado correctamente');
            navigate(-1);
          } catch (err: any) {
            showAlert('Error', typeof err === 'string' ? err : 'No se pudo eliminar el usuario');
          }
        },
      },
    ]);

  const isMe = userId === user._id;
  const reviewCount = user.sellerRating?.count ?? 0;
  const openReviews = () => navigate(`/seller/${user._id}/reviews`);

  return (
    <div className="page">
      <BackButton />
      <div className="profile-layout">
        {/* Encabezado */}
        <aside className="profile-layout__aside card stack" style={{ gap: 12 }}>
          <div className="profile-head" style={{ marginBottom: 0 }}>
            <Avatar src={user.profileImg} size={110} ring />
            <h1 className="profile-head__name">{user.username}</h1>
            {/* ✔ Verificado: 1000 puntos o más */}
            <VerifiedBadge points={user.points} />
            <button type="button" className="rating-pill" onClick={openReviews} aria-label="Ver reseñas">
              <SellerRatingBadge rating={user.sellerRating} />
              <span className="rating-pill__chevron" aria-hidden>›</span>
            </button>
            {/* Puntos: +50 por cada reseña recibida (venta o regalo) */}
            {!!user.points && <span className="points-chip">🏅 {user.points} puntos</span>}
            {user.aboutMe ? (
              <p>{user.aboutMe}</p>
            ) : (
              <p className="meta" style={{ fontStyle: 'italic' }}>Este vendedor no agregó descripción</p>
            )}
          </div>

          {!userId && (
            <button type="button" className="btn btn--block" onClick={() => requestLogin(navigate)}>
              Inicia sesión para contactarlo
            </button>
          )}
          {!!userId && !isMe && (
            <button
              type="button"
              className="btn btn--whatsapp btn--block"
              onClick={() => contactSellerOnWhatsApp(user._id, user.username, buildContactMessage(user.username))}
            >
              💬 Contactar por WhatsApp
            </button>
          )}
          {!!userId && !isMe && <ReportButton target="user" targetId={user._id} targetName={user.username} />}
          {isMe && (
            <button type="button" className="btn btn--outline btn--block" onClick={() => navigate('/profile')}>
              Editar mi perfil
            </button>
          )}
          {isAdmin && !isMe && (
            <button type="button" className="btn btn--danger btn--block btn--sm" onClick={handleDeleteUser}>
              Eliminar usuario
            </button>
          )}
        </aside>

        <div>
          {/* Reseñas */}
          {latestReviews.length > 0 && (
            <section className="section">
              <h2 className="section-title">
                Reseñas{reviewCount > 0 && <span className="section-count">{reviewCount}</span>}
              </h2>
              <div className="list">
                {latestReviews.map(r => <ReviewCard key={r._id} review={r} />)}
              </div>
              {reviewCount > latestReviews.length && (
                <button
                  type="button"
                  className="link"
                  style={{ display: 'block', margin: '10px auto 0' }}
                  onClick={openReviews}
                >
                  Ver todas las reseñas ({reviewCount})
                </button>
              )}
            </section>
          )}

          {/* Productos */}
          <section>
            <h2 className="section-title">
              Productos del vendedor
              {products.length > 0 && <span className="section-count">{products.length}</span>}
            </h2>
            {products.length === 0 ? (
              <p className="empty">
                <span style={{ fontSize: 32 }}>📦</span><br />
                <strong style={{ color: 'var(--text)' }}>Sin productos</strong><br />
                Este vendedor no tiene productos publicados
              </p>
            ) : (
              <div className="product-grid">
                {products.map(item => (
                  <button key={item._id} type="button" className="product-card" onClick={() => navigate(`/product/${item._id}`)}>
                    <img src={item.imgURL} alt={item.name} className="product-card__img" loading="lazy" />
                    <span className="product-card__body">
                      <span className="product-card__name">{item.name}</span>
                      <span className="price">{getPriceLabel(item)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerProfileScreen;
