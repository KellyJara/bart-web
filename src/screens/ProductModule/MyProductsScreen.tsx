import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { contactService } from '../../redux/services/contactService';
import { fetchProducts, deleteProduct } from '../../redux/slices/product/productSlice';
import { fetchFavorites } from '../../redux/slices/favorite/favoriteSlice';
import { selectMyProducts } from '../../redux/slices/auth/authSelectors';
import ShareProductButton from '../../components/ShareProductButton';
import MarkCompletedButton from '../../components/MarkCompletedButton';
import { formatFavoritesCount } from '../../utils/favorites';
import { getPriceLabel, isGiftProduct, isPriceOpen } from '../../utils/productPrice';
import { showAlert } from '../../utils/dialog';
import { PageLoader } from '../../components/ui';
import '../../styles/seller.css';

/**
 * Mis productos (vendedor): lo que publicó, del más nuevo al más viejo, con su estado,
 * quién le escribió por WhatsApp y las acciones (marcar vendido/regalado, editar, compartir, eliminar).
 */
const MyProductsScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const myProducts = useAppSelector(selectMyProducts);
  const { roles, userId } = useAppSelector(state => state.auth);
  const { loading, items } = useAppSelector(state => state.products);

  // Personas que contactaron por WhatsApp por cada producto
  const [contactsByProduct, setContactsByProduct] = useState<Record<string, number>>({});

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchFavorites());
    contactService.getSummary()
      .then(res => setContactsByProduct(res.data))
      .catch(err => console.log('Error cargando contactos:', err));
  }, [dispatch]);

  const openCreate = () => navigate('/products/new');
  const handleEdit = (productId: string) => navigate(`/products/${productId}/edit`);
  const openContacts = (productId: string) => navigate(`/products/${productId}/contacts`);

  const canDelete = (ownerId: string) => ownerId === userId || roles.includes('ADMIN');

  const handleDelete = (id: string) => {
    showAlert('Eliminar producto', '¿Seguro que deseas eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => dispatch(deleteProduct(id)) },
    ]);
  };

  return (
    <div className="page">
      <div className="sl-header">
        <div>
          <h1 className="page-title">Mis productos</h1>
          {myProducts.length > 0 && (
            <p className="meta">
              {myProducts.length === 1
                ? 'Tienes 1 producto publicado'
                : `Tienes ${myProducts.length} productos publicados`}
            </p>
          )}
        </div>
        {myProducts.length > 0 && (
          <button type="button" className="btn btn--sm" onClick={openCreate}>
            ＋ Publicar producto
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <PageLoader />
      ) : myProducts.length === 0 ? (
        <div className="empty">
          <div className="sl-empty-emoji">🛍️</div>
          <p className="sl-empty-title">Aún no has publicado productos</p>
          <p>Vende o regala lo que ya no usas. Solo necesitas una foto, un nombre y un precio.</p>
          <button type="button" className="btn" style={{ marginTop: 16 }} onClick={openCreate}>
            ＋ Publicar mi primer producto
          </button>
        </div>
      ) : (
        <div className="list--grid">
          {myProducts.map(item => {
            const isGift = isGiftProduct(item);
            const contacts = contactsByProduct[item._id];
            const isCompleted = item.dealStatus === 'completed';

            return (
              <div key={item._id} className="card card--white sl-card">
                {/* Foto + datos (abre la edición, como en la app) */}
                <button type="button" className="sl-card__main" onClick={() => handleEdit(item._id)}>
                  {item.imgURL ? (
                    <img src={item.imgURL} alt="" className="sl-thumb" />
                  ) : (
                    <span className="sl-thumb">📦</span>
                  )}
                  <span className="sl-card__info">
                    <span className="name sl-clamp-2">{item.name}</span>
                    <span className="price">{getPriceLabel(item)}</span>
                    <span className="meta">{formatFavoritesCount(item.favoritesCount)}</span>
                  </span>
                </button>

                {/* Estado (vendido/regalado lo muestra MarkCompletedButton) */}
                {!isCompleted && (
                  <div className="sl-tags">
                    {item.dealStatus === 'reserved' ? (
                      <span className="sl-tag sl-tag--warning">🔒 Reservado</span>
                    ) : item.isActive ? (
                      <span className="sl-tag sl-tag--success">● Disponible</span>
                    ) : (
                      <span className="sl-tag">Inactivo</span>
                    )}
                    {!isGift && item.acceptsOffers && !isPriceOpen(item) && (
                      <span className="sl-tag sl-tag--primary">💰 Acepta ofertas</span>
                    )}
                  </div>
                )}

                {/* Quién escribió por WhatsApp (y marcar a quién se le vendió/regaló) */}
                {!!contacts && (
                  <button
                    type="button"
                    className="btn btn--whatsapp btn--block btn--sm"
                    onClick={() => openContacts(item._id)}
                  >
                    💬 {contacts === 1 ? '1 persona te escribió' : `${contacts} personas te escribieron`}
                  </button>
                )}

                {/* Vendido / regalado: ya no disponible */}
                <MarkCompletedButton product={item} onChanged={() => dispatch(fetchProducts())} />

                {/* Acciones secundarias: mismo tamaño */}
                <div className="sl-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleEdit(item._id)}>
                    ✏️ Editar
                  </button>
                  {!isCompleted && (
                    <div>
                      <ShareProductButton product={item} small />
                    </div>
                  )}
                  {canDelete(item.owner._id) && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(item._id)}
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProductsScreen;
