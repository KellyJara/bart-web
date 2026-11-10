import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchProductById } from '../../redux/slices/product/productSlice';
import { toggleFavorite } from '../../redux/slices/favorite/favoriteSlice';
import ShareProductButton from '../../components/ShareProductButton';
import ProductRequestSection from '../../components/ProductRequestSection';
import ProductImageGallery from '../../components/ProductImageGallery';
import { getProductImages } from '../../redux/types/product.type';
import { getCategoryLabel } from '../../constants/categories';
import ReportButton from '../../components/ReportButton';
import { formatFavoritesCount } from '../../utils/favorites';
import ReviewSellerSection from '../../components/ReviewSellerSection';
import { SellerRatingBadge } from '../../components/StarRating';
import { buildProductContactMessage, contactSellerAboutProduct } from '../../utils/whatsapp';
import { requestLogin, useRequireAuth } from '../../utils/authGate';
import { showAlert } from '../../utils/dialog';
import { getPriceLabel, isGiftProduct, isPriceOpen } from '../../utils/productPrice';
import { Avatar, BackButton, PageLoader } from '../../components/ui';
import VerifiedBadge from '../../components/VerifiedBadge';
import HeartIcon from '../../components/HeartIcon';
import EmptyState from '../../components/EmptyState';
import '../../styles/products.css';

const ProductDetailScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { productId = '' } = useParams();

  const { selectedProduct, loading, error } = useAppSelector(state => state.products);
  const userId = useAppSelector(state => state.auth.userId);
  const favoriteItems = useAppSelector(state => state.favorite.items);

  // Traer producto
  useEffect(() => {
    dispatch(fetchProductById(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (selectedProduct?._id === productId) document.title = `${selectedProduct.name} · Bart`;
    return () => {
      document.title = 'Bart';
    };
  }, [selectedProduct, productId]);

  if (loading) return <PageLoader />;

  if (error && !selectedProduct) {
    return (
      <EmptyState
        emoji="⚠️"
        title="No pudimos cargar el producto"
        message={error}
        action={<Link to="/" className="link">Ver otros productos</Link>}
      />
    );
  }

  if (!selectedProduct) {
    return (
      <EmptyState
        emoji="🔍"
        title="No se encontró el producto"
        action={<Link to="/" className="link">Ver otros productos</Link>}
      />
    );
  }

  const owner = selectedProduct.owner;
  const sellerId = owner?._id;
  const isOwner = !!sellerId && userId === sellerId;
  const isGift = isGiftProduct(selectedProduct);
  const canContact = !!userId && !isOwner && !!sellerId;
  const isFavorite = favoriteItems.includes(selectedProduct._id);
  const reload = () => dispatch(fetchProductById(productId));

  const handleToggleFavorite = async () => {
    try {
      await dispatch(toggleFavorite(selectedProduct._id)).unwrap();
    } catch {
      showAlert('Error', 'No se pudo actualizar favoritos');
    }
  };

  return (
    <div className="page">
      <BackButton />
      <div className="detail">
        {/* Galería de fotos (hasta 4) */}
        <div className="detail__gallery">
          <ProductImageGallery images={getProductImages(selectedProduct)} />
        </div>

        <div className="stack" style={{ gap: 14 }}>
          {/* Nombre, precio y etiquetas */}
          <div className="detail-card">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <h1 className="detail__name grow">{selectedProduct.name}</h1>
              {!isOwner && (
                <button
                  type="button"
                  className={`fav-btn${isFavorite ? ' fav-btn--active' : ''}`}
                  style={{ position: 'static', flexShrink: 0 }}
                  onClick={() => requireAuth(handleToggleFavorite, { resume: false })}
                  aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  aria-pressed={isFavorite}
                >
                  <HeartIcon filled={isFavorite} size={22} />
                </button>
              )}
            </div>
            {isGift ? (
              <span className="tags"><span className="tag tag--success tag--lg">🎁 Gratis</span></span>
            ) : (
              <p className="detail__price">{getPriceLabel(selectedProduct)}</p>
            )}

            <div className="tags">
              {!!selectedProduct.category && (
                <span className="tag tag--primary">{getCategoryLabel(selectedProduct.category)}</span>
              )}
              {/* Solo barrio y ciudad: la dirección exacta nunca se guarda */}
              {!!selectedProduct.locationLabel && <span className="tag">📍 {selectedProduct.locationLabel}</span>}
              {!isGift && !!selectedProduct.acceptsOffers && !isPriceOpen(selectedProduct) && (
                <span className="tag tag--warning">💰 Acepta ofertas</span>
              )}
              <span className={`tag ${selectedProduct.isActive ? 'tag--success' : 'tag--error'}`}>
                {selectedProduct.isActive ? 'Activo' : 'Inactivo'}
              </span>
              <span className="tag">Stock: {selectedProduct.stock}</span>
            </div>

            <p className="meta">{formatFavoritesCount(selectedProduct.favoritesCount)}</p>
          </div>

          {/* Abierto desde un enlace compartido sin sesión: invitar a iniciar sesión */}
          {!userId && (
            <button type="button" className="btn btn--block" onClick={() => requestLogin(navigate)}>
              🔐 Inicia sesión para contactar
            </button>
          )}

          {/* Contactar al vendedor por WhatsApp (solo productos de otras personas) */}
          {canContact && (
            <button
              type="button"
              className="btn btn--whatsapp btn--block"
              onClick={() =>
                contactSellerAboutProduct(
                  selectedProduct._id,
                  owner.username,
                  buildProductContactMessage(owner.username, selectedProduct.name)
                )
              }
            >
              💬 Contactar al vendedor
            </button>
          )}

          {/* Hacer una oferta (por WhatsApp), estado vendido/regalado y acciones del dueño */}
          <ProductRequestSection product={selectedProduct} userId={userId} onChanged={reload} />

          {/* Vendedor: perfil y calificación */}
          {!!sellerId && (
            <div>
              <h2 className="section-title">Vendedor</h2>
              <div className="seller-row">
                <button
                  type="button"
                  className="row grow"
                  style={{ textAlign: 'left', minWidth: 0 }}
                  onClick={() => navigate(`/seller/${sellerId}`)}
                >
                  <Avatar src={owner.profileImg} size={52} ring />
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="seller-name-row">
                      <span className="name ellipsis">{owner.username ?? 'Unknown'}</span>
                      <VerifiedBadge points={owner.points} compact />
                    </span>
                    <span className="meta" style={{ display: 'block' }}>Ver perfil</span>
                  </span>
                </button>
                {/* Calificación del vendedor (toca para ver sus reseñas) */}
                <button
                  type="button"
                  onClick={() => navigate(`/seller/${sellerId}/reviews`)}
                  aria-label="Ver reseñas del vendedor"
                >
                  <SellerRatingBadge rating={owner.sellerRating} />
                </button>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <h2 className="section-title">Descripción</h2>
            <div className="detail-card">
              {selectedProduct.description?.trim() ? (
                <p className="detail-description">{selectedProduct.description}</p>
              ) : (
                // Sin descripción: un aviso en lugar de un espacio vacío
                <p className="detail-description detail-description--empty">
                  {isOwner
                    ? 'No agregaste una descripción. Puedes agregarla en "Editar producto".'
                    : 'El vendedor no agregó una descripción para este producto.'}
                </p>
              )}
            </div>
          </div>

          {/* Calificar al vendedor (solo si cerraste un trato con él) */}
          {!!userId && !isOwner && (
            <ReviewSellerSection
              productId={selectedProduct._id}
              sellerName={owner?.username ?? 'el vendedor'}
              onSaved={reload}
            />
          )}

          {isOwner && (
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => navigate(`/products/${selectedProduct._id}/edit`)}
            >
              ✏️ Editar producto
            </button>
          )}

          {/* Botón Compartir */}
          <ShareProductButton product={selectedProduct} label="Compartir producto" />

          {/* Reportar (solo productos de otras personas) */}
          {!!userId && !isOwner && (
            <ReportButton target="product" targetId={selectedProduct._id} targetName={selectedProduct.name} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailScreen;
