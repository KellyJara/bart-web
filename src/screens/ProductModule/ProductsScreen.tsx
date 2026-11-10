import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { deleteProduct, fetchFeed, fetchProducts } from '../../redux/slices/product/productSlice';
import {
  declineLocation,
  initLocation,
  markConsentAsked,
  requestLocation,
} from '../../redux/slices/location/locationSlice';
import { Product, ProductFilters } from '../../redux/types/product.type';
import NearbyFilterBar from '../../components/NearbyFilterBar';
import { toggleFavorite } from '../../redux/slices/favorite/favoriteSlice';
import { selectIsAdmin } from '../../redux/slices/auth/authSelectors';
import { useRequireAuth } from '../../utils/authGate';
import { formatFavoritesCount } from '../../utils/favorites';
import { getPriceLabel, isGiftProduct, isPriceOpen } from '../../utils/productPrice';
import { showAlert } from '../../utils/dialog';
import { Spinner } from '../../components/ui';
import VerifiedBadge from '../../components/VerifiedBadge';
import EmptyState from '../../components/EmptyState';
import HeartIcon from '../../components/HeartIcon';
import '../../styles/products.css';

// "📍 Chapinero, Bogotá · a 2 km" | "📍 Chapinero, Bogotá" | "📍 A 2 km"
const locationChipLabel = (item: Pick<Product, 'locationLabel' | 'distanceKm'>) => {
  const distance =
    item.distanceKm === undefined ? '' : item.distanceKm < 1 ? 'a menos de 1 km' : `a ${item.distanceKm} km`;
  const text = [item.locationLabel, distance].filter(Boolean).join(' · ');
  return `📍 ${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

// Más recientes primero
const byNewest = (a: Product, b: Product) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

type CardProps = {
  item: Product;
  isFavorite: boolean;
  isAdmin: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
};

const ProductCard = ({ item, isFavorite, isAdmin, onOpen, onToggleFavorite, onDelete }: CardProps) => {
  const isGift = isGiftProduct(item);
  // "Acepta ofertas" solo en productos con precio (los de precio abierto ya dicen "Recibe ofertas")
  const showOffers = !isGift && !!item.acceptsOffers && !isPriceOpen(item);
  const showLocation = item.distanceKm !== undefined || !!item.locationLabel;

  return (
    <article className="product-card">
      <button type="button" className="product-card__open" onClick={onOpen}>
        <img src={item.imgURL} alt={item.name} className="product-card__img" loading="lazy" />
        <div className="product-card__body">
          <span className="product-card__name" title={item.name}>{item.name}</span>
          {isGift ? (
            <span className="tags"><span className="tag tag--success tag--lg">🎁 Gratis</span></span>
          ) : (
            <span className="price product-card__price">{getPriceLabel(item)}</span>
          )}

          {(showOffers || showLocation) && (
            <span className="tags product-card__tags">
              {showOffers && <span className="tag tag--primary">💰 Acepta ofertas</span>}
              {/* Zona ("Chapinero, Bogotá") y, si se filtró por cercanía, la distancia */}
              {showLocation && <span className="tag" title={item.locationLabel}>{locationChipLabel(item)}</span>}
            </span>
          )}

          <span className="product-card__footer">
            <span className="owner-line meta">
              <span className="ellipsis">👤 {item.owner?.username}</span>
              <VerifiedBadge points={item.owner?.points} compact />
            </span>
            {!!item.favoritesCount && (
              <span className="meta">{formatFavoritesCount(item.favoritesCount, { short: true })}</span>
            )}
          </span>
        </div>
      </button>

      {/* Corazón: relleno de rojo si es favorito; si no, solo el contorno */}
      <button
        type="button"
        className={`fav-btn${isFavorite ? ' fav-btn--active' : ''}`}
        onClick={onToggleFavorite}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={isFavorite}
      >
        <HeartIcon filled={isFavorite} />
      </button>

      {isAdmin && (
        <div className="product-card__body" style={{ paddingTop: 0 }}>
          <span className="meta ellipsis">User Id: {item.owner?._id}</span>
          <span className="meta ellipsis">Product Id: {item._id}</span>
          <button type="button" className="btn btn--danger btn--sm" style={{ marginTop: 6 }} onClick={onDelete}>
            🗑️ Eliminar
          </button>
        </div>
      )}
    </article>
  );
};

const ProductsScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useAppSelector(selectIsAdmin);
  const userId = useAppSelector(state => state.auth.userId);
  const requireAuth = useRequireAuth();

  const { feed: products, feedLoading } = useAppSelector(state => state.products);
  const { coords, status: locationStatus, consentAsked, radiusKm, listingType, category } = useAppSelector(state => state.location);
  const { items: favoriteItems } = useAppSelector(state => state.favorite);

  // -------------------- Cargar datos al inicio -------------------- //
  useEffect(() => {
    if (userId) {
      dispatch(fetchProducts()); // listado completo (favoritos del perfil, etc.)
    }
  }, [dispatch, userId]);

  // -------------------- Ubicación -------------------- //
  // Al abrir: revisar sin mostrar diálogos (solo lee si el usuario ya aceptó antes)
  useEffect(() => {
    if (locationStatus === 'idle') {
      dispatch(initLocation());
    }
  }, [dispatch, locationStatus]);

  // Primera vez: explicar para qué usamos la ubicación y preguntar ANTES
  // de mostrar el permiso del navegador. Si dice "Ahora no", no se lee nada.
  useEffect(() => {
    if (locationStatus === 'needs_consent' && !consentAsked) {
      dispatch(markConsentAsked());
      showAlert(
        '📍 ¿Usar tu ubicación?',
        'Bart usa tu ubicación aproximada para mostrarte productos que se venden o se regalan cerca de ti. ' +
          'Solo se usa mientras usas Bart y nunca se muestra a otras personas.',
        [
          { text: 'Ahora no', style: 'cancel', onPress: () => dispatch(declineLocation()) },
          { text: 'Permitir', onPress: () => dispatch(requestLocation()) },
        ]
      );
    }
  }, [dispatch, locationStatus, consentAsked]);

  // Buscador por nombre: se busca en el servidor (todos los productos, no solo los cargados)
  // cuando el usuario deja de escribir un momento
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(text.trim()), 400);
  };
  const searchNow = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchQuery(search.trim());
  };
  const clearSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearch('');
    setSearchQuery('');
  };
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const filters: ProductFilters = {
    ...(searchQuery && { q: searchQuery }),
    ...(listingType !== 'all' && { type: listingType }),
    ...(category && { category }),
    available: true, // los productos reservados no salen en la lista principal
    ...(coords && radiusKm !== null && {
      lat: coords.latitude,
      lng: coords.longitude,
      radius: radiusKm,
    }),
  };
  const filtersKey = JSON.stringify(filters);
  const waitingForLocation = locationStatus === 'idle' || locationStatus === 'loading';

  // Recargar el listado cuando cambian la ubicación o los filtros
  useEffect(() => {
    if (!waitingForLocation) {
      dispatch(fetchFeed(JSON.parse(filtersKey)));
    }
  }, [dispatch, filtersKey, waitingForLocation]);

  // -------------------- Handlers -------------------- //
  const handleDelete = (id: string) => {
    showAlert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProduct(id)).unwrap();
              showAlert('Éxito', 'Producto eliminado correctamente');
            } catch {
              showAlert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      await dispatch(toggleFavorite(productId)).unwrap();
    } catch {
      showAlert('Error', 'No se pudo actualizar favoritos');
    }
  };

  // Los productos propios no salen en la lista principal; los más nuevos primero
  const productsToShow = products.filter(product => product.owner?._id !== userId).sort(byNewest);
  const showSpinner = (feedLoading && productsToShow.length === 0) || waitingForLocation;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title grow">Productos</h1>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => requireAuth(() => navigate('/products/new'))}
        >
          ＋ Publicar
        </button>
      </div>

      {/* Buscador por nombre del producto */}
      <form
        className="search-field"
        role="search"
        onSubmit={e => {
          e.preventDefault();
          searchNow();
        }}
      >
        <span className="search-field__icon" aria-hidden>🔍</span>
        <input
          type="search"
          className="input"
          placeholder="Buscar productos"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          enterKeyHint="search"
          aria-label="Buscar productos por nombre"
        />
        {!!search && (
          <button type="button" className="search-field__clear" onClick={clearSearch} aria-label="Borrar búsqueda">
            ✕
          </button>
        )}
      </form>

      <NearbyFilterBar />

      {showSpinner ? (
        <div className="center" style={{ minHeight: 200 }}>
          <Spinner />
        </div>
      ) : productsToShow.length === 0 ? (
        searchQuery ? (
          // Sin resultados para la búsqueda
          <EmptyState
            emoji="🔍"
            title={`No encontramos "${searchQuery}"`}
            message={
              filters.radius
                ? `Solo buscamos a menos de ${filters.radius} km. Prueba con otra palabra o un radio mayor.`
                : 'Prueba con otra palabra o cambia los filtros.'
            }
            action={
              <button type="button" className="btn btn--secondary btn--sm" onClick={clearSearch}>
                Borrar búsqueda
              </button>
            }
          />
        ) : (
          <EmptyState
            emoji={filters.radius ? '📍' : '🛍️'}
            title={filters.radius ? 'Nada por aquí cerca' : 'No hay productos disponibles'}
            message={
              filters.radius
                ? `No hay productos a menos de ${filters.radius} km. Prueba con un radio mayor.`
                : 'Vuelve más tarde o cambia los filtros.'
            }
          />
        )
      ) : (
        <div className="product-grid" style={{ opacity: feedLoading ? 0.6 : 1 }}>
          {productsToShow.map(item => (
            <ProductCard
              key={item._id}
              item={item}
              isFavorite={favoriteItems.includes(item._id)}
              isAdmin={isAdmin}
              onOpen={() => requireAuth(() => navigate(`/product/${item._id}`))}
              onToggleFavorite={() => requireAuth(() => handleToggleFavorite(item._id), { resume: false })}
              onDelete={() => handleDelete(item._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsScreen;
