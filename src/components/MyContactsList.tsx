import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../redux/services/contactService';
import { MyContact } from '../redux/types/contact.type';
import { formatPrice } from '../utils/currency';
import { timeAgo } from '../utils/format';
import { isGiftProduct, isPriceOpen } from '../utils/productPrice';
import { Chip, PageLoader } from './ui';
import '../styles/seller.css';

// "precio $ 120.000" o "sin precio fijo" (el vendedor recibe ofertas)
const priceText = (p: { price: number | null; priceOpen?: boolean }) =>
  isPriceOpen(p) || p.price == null ? 'sin precio fijo' : `precio ${formatPrice(p.price)}`;

type Filter = 'all' | 'offers' | 'available' | 'closed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'offers', label: '💰 Con oferta' },
  { value: 'available', label: '🟢 Disponibles' },
  { value: 'closed', label: 'Cerradas' },
];

type Tone = 'neutral' | 'primary' | 'success' | 'warning';
type Status = { label: string; tone: Tone; hint?: string; closed: boolean };

// Estado del producto, visto por quien escribió u ofreció
const describeStatus = (c: MyContact): Status => {
  const p = c.product;
  if (!p) return { label: 'Producto eliminado', tone: 'neutral', closed: true };
  const isGift = isGiftProduct(p);
  if (c.boughtByMe) {
    return {
      label: isGift ? '🎁 Recibido' : '✅ Comprado',
      tone: 'success',
      hint: '⭐ Ábrelo para calificar al vendedor',
      closed: false,
    };
  }
  if (p.dealStatus === 'completed') {
    return { label: isGift ? 'Ya fue regalado' : 'Ya fue vendido', tone: 'neutral', closed: true };
  }
  if (p.isActive === false) return { label: 'No disponible', tone: 'neutral', closed: true };
  if (p.dealStatus === 'reserved') return { label: '🔒 Reservado', tone: 'warning', closed: false };
  return { label: '🟢 Disponible', tone: 'success', closed: false };
};

const matchesFilter = (c: MyContact, filter: Filter) => {
  if (filter === 'all') return true;
  if (filter === 'offers') return !!c.lastOfferAmount;
  const { closed } = describeStatus(c);
  return filter === 'closed' ? closed : !closed && !c.boughtByMe;
};

/**
 * Postulaciones (comprador): productos por los que contactó al vendedor por WhatsApp
 * o le hizo una oferta, con su estado (similar a las antiguas "Mis solicitudes").
 * Bart registra cuando se toca el botón; no puede saber si el mensaje de WhatsApp se envió de verdad.
 */
const MyContactsList = () => {
  const navigate = useNavigate();
  const openProduct = (productId: string) => navigate(`/product/${productId}`);

  const [contacts, setContacts] = useState<MyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      const res = await contactService.getMine();
      setContacts(res.data);
      setError(false);
    } catch (err) {
      console.log('Error cargando mis contactos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al entrar y al volver a la pestaña (pudo escribir u ofertar en otro producto)
  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  if (loading) return <PageLoader />;

  const visible = contacts.filter(c => matchesFilter(c, filter));

  return (
    <div>
      {contacts.length > 0 && (
        <div className="chips chips--scroll" style={{ marginBottom: 16 }}>
          {FILTERS.map(f => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        error ? (
          <div className="empty">
            <div className="sl-empty-emoji">⚠️</div>
            <p className="sl-empty-title">No se pudo cargar</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              style={{ marginTop: 12 }}
              onClick={() => {
                setLoading(true);
                load();
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty">
            <div className="sl-empty-emoji">💬</div>
            <p className="sl-empty-title">Aún no has contactado a nadie</p>
            <p>
              Cuando toques "Contactar por WhatsApp" o "Hacer una oferta" en un producto, aquí verás en qué va
              cada uno.
            </p>
          </div>
        ) : (
          <div className="empty">
            <div className="sl-empty-emoji">🔍</div>
            <p className="sl-empty-title">No hay productos con este filtro.</p>
          </div>
        )
      ) : (
        <div className="list--grid">
          {visible.map(item => {
            const { product } = item;
            const status = describeStatus(item);
            const isGift = isGiftProduct(product);
            const image = product?.images?.[0] || product?.imgURL;
            const offers = item.offerCount ?? 0;
            const messages = Math.max(item.count - offers, 0);

            return (
              <button
                key={item._id}
                type="button"
                className={`card card--white sl-card__main${status.closed ? ' card--muted' : ''}`}
                disabled={!product}
                onClick={() => product && openProduct(product._id)}
              >
                {image ? <img src={image} alt="" className="sl-thumb" /> : <span className="sl-thumb">📦</span>}

                <span className="sl-card__info">
                  <span className="name ellipsis">{product?.name ?? 'Producto eliminado'}</span>

                  {/* Lo que hizo: oferta (con monto) o mensaje */}
                  {item.lastOfferAmount ? (
                    <span className="meta">
                      💰 Ofreciste <span className="sl-offer">{formatPrice(item.lastOfferAmount)}</span>
                      {product ? ` · ${priceText(product)}` : ''}
                    </span>
                  ) : (
                    <span className="meta">
                      {isGift
                        ? '🎁 Regalo · le escribiste'
                        : `💬 Le escribiste${product ? ` · ${priceText(product)}` : ''}`}
                    </span>
                  )}

                  {!!item.seller && <span className="meta">De {item.seller.username}</span>}

                  <span className="meta">
                    {[
                      offers > 1 ? `${offers} ofertas` : '',
                      messages > 1 ? `${messages} mensajes` : '',
                      timeAgo(item.lastContactAt),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>

                  <span className={`sl-tag sl-tag--${status.tone}`} style={{ marginTop: 4 }}>{status.label}</span>
                  {!!status.hint && <span className="hint">{status.hint}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyContactsList;
