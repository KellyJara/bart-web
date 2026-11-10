import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchProductById, fetchProducts } from '../../redux/slices/product/productSlice';
import { contactService } from '../../redux/services/contactService';
import { getApiErrorMessage, requestService } from '../../redux/services/requestService';
import { ProductContact } from '../../redux/types/contact.type';
import { SellerRatingBadge } from '../../components/StarRating';
import { formatPrice } from '../../utils/currency';
import { getPriceLabel, isGiftProduct } from '../../utils/productPrice';
import { REVIEW_POINTS } from '../../utils/levels';
import { timeAgo } from '../../utils/format';
import { showAlert } from '../../utils/dialog';
import { Avatar, BackButton, PageLoader, Spinner } from '../../components/ui';
import '../../styles/seller.css';

// "💬 Te escribió 2 veces" / "💰 1 oferta · 💬 Te escribió 1 vez" (cuenta toques; Bart no ve los mensajes)
const contactSummary = (c: ProductContact) => {
  const offers = c.offerCount ?? 0;
  const messages = Math.max(c.count - offers, 0);
  const parts = [
    offers ? `💰 ${offers === 1 ? '1 oferta' : `${offers} ofertas`}` : '',
    messages ? `💬 ${messages === 1 ? 'Te escribió 1 vez' : `Te escribió ${messages} veces`}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
};

/**
 * Dueño de un producto: personas que lo contactaron por WhatsApp y lo que ofrecieron.
 * Puede marcar (opcional) a quién se lo vendió o regaló: esa persona podrá
 * calificarlo, y el dueño gana 50 puntos cuando esa persona deja su reseña (venta o regalo).
 */
const ProductContactsScreen = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { productId = '' } = useParams();
  const product = useAppSelector(state =>
    state.products.selectedProduct?._id === productId ? state.products.selectedProduct : null
  );

  const [contacts, setContacts] = useState<ProductContact[]>([]);
  const [soldTo, setSoldTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isGift = isGiftProduct(product);
  const doneLabel = isGift ? 'regalaste' : 'vendiste';

  const load = useCallback(async () => {
    try {
      const res = await contactService.getForProduct(productId);
      setContacts(res.data.contacts);
      setSoldTo(res.data.soldTo);
    } catch (err) {
      showAlert('Error', getApiErrorMessage(err, 'No se pudieron cargar los contactos'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    dispatch(fetchProductById(productId));
    load();
  }, [dispatch, productId, load]);

  const chooseRecipient = (contact: ProductContact) => {
    const name = contact.buyer.username;
    showAlert(
      isGift ? `¿Se lo regalaste a ${name}?` : `¿Se lo vendiste a ${name}?`,
      `El producto quedará como ${isGift ? 'regalado' : 'vendido'} y ${name} podrá dejarte una reseña.` +
        `\n\nCuando deje su reseña ganarás ${REVIEW_POINTS} puntos en tu perfil 🏅`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setBusyId(contact._id);
            try {
              const res = await requestService.complete(productId, contact.buyer._id);
              setSoldTo(contact.buyer._id);
              dispatch(fetchProductById(productId));
              dispatch(fetchProducts());
              showAlert(
                '¡Listo!',
                `Le avisamos a ${name} para que te califique.` +
                  (res.data.pointsPending
                    ? `\n\n🏅 Ganarás ${res.data.pointsPending} puntos cuando ${name} deje su reseña.`
                    : '')
              );
            } catch (err) {
              showAlert('Error', getApiErrorMessage(err));
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <PageLoader />;

  const recipient = contacts.find(c => c.buyer._id === soldTo);

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 12 }}>Contactos por WhatsApp</h1>

      {product && (
        <div className="card card--white row" style={{ marginBottom: 14 }}>
          <img src={product.imgURL} alt="" className="sl-thumb" />
          <div className="grow" style={{ minWidth: 0 }}>
            <p className="name sl-clamp-2" style={{ color: 'var(--primary)' }}>{product.name}</p>
            <p className="price">{getPriceLabel(product)}</p>
          </div>
        </div>
      )}

      {soldTo ? (
        <div className="sl-banner sl-banner--success">
          <span className="sl-banner__icon">✅</span>
          <span>
            Se lo {doneLabel} a {recipient?.buyer.username ?? 'otra persona'}. Puede dejarte una reseña.
          </span>
        </div>
      ) : contacts.length > 0 ? (
        <div className="sl-banner">
          <span className="sl-banner__icon">💡</span>
          <span>
            Cuando cierres el trato, marca a quién se lo {doneLabel} (opcional): esa persona podrá
            calificarte; cuando lo haga, ganarás {REVIEW_POINTS} puntos 🏅.
          </span>
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <div className="empty">
          <div className="sl-empty-emoji">💬</div>
          <p className="sl-empty-title">Aún no te han escrito</p>
          <p>Todavía nadie te ha contactado por WhatsApp desde este producto.</p>
        </div>
      ) : (
        <div className="list">
          {contacts.map(item => {
            const isRecipient = item.buyer._id === soldTo;
            return (
              <div key={item._id} className={`card card--white sl-card${isRecipient ? ' card--selected' : ''}`}>
                <button
                  type="button"
                  className="sl-card__main"
                  onClick={() => navigate(`/seller/${item.buyer._id}`)}
                  aria-label={`Ver perfil de ${item.buyer.username}`}
                >
                  <Avatar src={item.buyer.profileImg} size={52} ring />
                  <span className="sl-card__info">
                    <span className="name ellipsis">{item.buyer.username}</span>
                    <SellerRatingBadge rating={item.buyer.sellerRating} showEmpty={false} />
                    {/* Oferta (si hizo una): la última, con el monto */}
                    {!!item.lastOfferAmount && (
                      <span className="sl-tag sl-tag--primary">
                        💰 Te ofreció {formatPrice(item.lastOfferAmount)}
                      </span>
                    )}
                    <span className="meta">
                      {contactSummary(item)} · {timeAgo(item.lastContactAt)}
                    </span>
                  </span>
                  <span className="sl-chevron" aria-hidden>›</span>
                </button>

                {isRecipient ? (
                  <span className="sl-tag sl-tag--success">✅ Se lo {doneLabel}</span>
                ) : (
                  !soldTo && (
                    <button
                      type="button"
                      className="btn btn--block btn--sm"
                      onClick={() => chooseRecipient(item)}
                      disabled={busyId !== null}
                    >
                      {busyId === item._id ? <Spinner small /> : isGift ? '🎁 Se lo regalé' : '✅ Se lo vendí'}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductContactsScreen;
