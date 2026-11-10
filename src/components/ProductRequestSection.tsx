import { useState } from 'react';
import { Product } from '../redux/types/product.type';
import { getApiErrorMessage, requestService } from '../redux/services/requestService';
import MarkCompletedButton from './MarkCompletedButton';
import OfferModal from './OfferModal';
import { formatPrice } from '../utils/currency';
import { showAlert } from '../utils/dialog';
import { isGiftProduct, isPriceOpen } from '../utils/productPrice';
import { Spinner } from './ui';
import '../styles/products.css';

type Props = {
  product: Product;
  userId: string | null;
  onChanged?: () => void; // para recargar el producto (p. ej. al liberar la reserva)
};

/**
 * Sección del detalle de producto. Todo el contacto es por WhatsApp
 * (ya no hay postulaciones a regalos ni ofertas guardadas en Bart).
 * - Comprador, producto en venta que acepta ofertas: "Hacer una oferta" -> pregunta el monto, lo registra y abre WhatsApp.
 * - Comprador, producto ya vendido/regalado: aviso de que no está disponible.
 * - Dueño: marcar como vendido/regalado y, si quedó una reserva del sistema anterior, liberarla.
 */
const ProductRequestSection = ({ product, userId, onChanged }: Props) => {
  const isGift = isGiftProduct(product);
  const isOwner = !!userId && product.owner?._id === userId;
  const isReserved = product.dealStatus === 'reserved';
  const isCompleted = product.dealStatus === 'completed'; // vendido o regalado
  // Reservado para mí, o el vendedor marcó que me lo vendió/regaló (soldTo)
  const reservedForMe =
    (isReserved || isCompleted) && !!userId && (product.reservedFor === userId || product.soldTo === userId);

  const [modalVisible, setModalVisible] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // Reservas que quedaron de las postulaciones/ofertas anteriores: el dueño las puede liberar
  const releaseReservation = () => {
    showAlert(
      'Liberar reserva',
      `"${product.name}" volverá a estar disponible para todos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Liberar',
          style: 'destructive',
          onPress: async () => {
            setReleasing(true);
            try {
              await requestService.release(product._id);
              onChanged?.();
            } catch (err) {
              showAlert('Error', getApiErrorMessage(err));
            } finally {
              setReleasing(false);
            }
          },
        },
      ]
    );
  };

  // ----- Dueño -----
  if (isOwner) {
    return (
      <div className="stack">
        {isReserved && (
          <>
            <span className="tags"><span className="tag tag--warning tag--lg">🔒 Reservado</span></span>
            <button
              type="button"
              className="btn btn--outline btn--block"
              onClick={releaseReservation}
              disabled={releasing}
            >
              {releasing ? <Spinner small /> : 'Liberar reserva'}
            </button>
          </>
        )}
        {/* Vendido / regalado */}
        <MarkCompletedButton product={product} onChanged={() => onChanged?.()} />
      </div>
    );
  }

  // ----- Otros usuarios -----
  // Ya vendido o regalado
  if (isCompleted) {
    return (
      <div className="status-card">
        <p className="status-card__title">
          {reservedForMe
            ? isGift ? '🎁 ¡Te lo regalaron!' : '✅ ¡Lo compraste!'
            : isGift ? '✅ Ya fue regalado' : '✅ Ya fue vendido'}
        </p>
        {!reservedForMe && <p className="meta">Este producto ya no está disponible.</p>}
      </div>
    );
  }

  // Sin oferta en regalos. Los productos sin precio siempre reciben ofertas.
  const canOffer = !isGift && (!!product.acceptsOffers || isPriceOpen(product)) && !!userId;
  if (!isReserved && !canOffer) return null;

  return (
    <div className="stack">
      {isReserved && !reservedForMe && (
        <span className="tags"><span className="tag tag--warning tag--lg">🔒 Reservado para otra persona</span></span>
      )}

      {canOffer && !isReserved && (
        <>
          <button type="button" className="btn btn--secondary btn--block" onClick={() => setModalVisible(true)}>
            💰 Hacer una oferta
          </button>
          <p className="hint">
            {isPriceOpen(product)
              ? 'El vendedor no puso precio: dile cuánto ofreces.'
              : `El vendedor acepta ofertas. Precio publicado: ${formatPrice(product.price)}`}
          </p>
        </>
      )}

      <OfferModal open={modalVisible} onClose={() => setModalVisible(false)} product={product} />
    </div>
  );
};

export default ProductRequestSection;
