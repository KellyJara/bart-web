import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../redux/types/product.type';
import { getApiErrorMessage, requestService } from '../redux/services/requestService';
import { isGiftProduct } from '../utils/productPrice';
import { REVIEW_POINTS } from '../utils/levels';
import { showAlert } from '../utils/dialog';
import { Spinner } from './ui';
import '../styles/seller.css';

type Props = {
  product: Pick<Product, '_id' | 'name' | 'price' | 'dealStatus'> &
    Partial<Pick<Product, 'soldTo' | 'priceOpen'>>;
  onChanged: () => void; // recargar el producto o la lista después del cambio
  className?: string;
};

/**
 * Botón del dueño para marcar el producto como vendido o regalado (ya no disponible).
 * Si ya está marcado, muestra la etiqueta y permite volver a publicarlo.
 */
const MarkCompletedButton = ({ product, onChanged, className }: Props) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const isGift = isGiftProduct(product);
  const isCompleted = product.dealStatus === 'completed';
  const doneLabel = isGift ? 'regalado' : 'vendido';

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      showAlert('Error', getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Lista de quienes contactaron por WhatsApp, para marcar a quién se lo vendió/regaló
  const openContacts = () => navigate(`/products/${product._id}/contacts`);

  const markCompleted = () => {
    const effects = `"${product.name}" dejará de aparecer en la lista.`;

    // Reservado: el receptor ya se conoce (la persona de la reserva)
    if (product.dealStatus === 'reserved') {
      showAlert(`¿Marcar como ${doneLabel}?`, effects, [
        { text: 'Cancelar', style: 'cancel' },
        { text: `Sí, ${doneLabel}`, onPress: () => run(() => requestService.complete(product._id)) },
      ]);
      return;
    }

    // Indicar a quién es opcional: permite que esa persona te califique (y ganas puntos cuando lo haga)
    showAlert(
      `¿A quién se lo ${isGift ? 'regalaste' : 'vendiste'}?`,
      `${effects}\n\nSi eliges a la persona, podrá calificarte. ` +
        `Cuando deje su reseña ganarás ${REVIEW_POINTS} puntos 🏅.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sin indicar', onPress: () => run(() => requestService.complete(product._id)) },
        { text: 'Elegir persona', onPress: openContacts },
      ]
    );
  };

  const reopen = () =>
    showAlert(
      'Volver a publicar',
      `"${product.name}" volverá a estar disponible.` +
        (product.soldTo
          ? `\n\nSi ya ganaste los ${REVIEW_POINTS} puntos de este ${isGift ? 'regalo' : 'producto'}, se descontarán.`
          : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Publicar', onPress: () => run(() => requestService.reopen(product._id)) },
      ]
    );

  if (busy) {
    return (
      <div className={`row ${className ?? ''}`} style={{ justifyContent: 'center', padding: 8 }}>
        <Spinner small />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className={`sl-completed-row ${className ?? ''}`}>
        <span className="sl-tag sl-tag--success">✅ {isGift ? 'Regalado' : 'Vendido'}</span>
        {/* Marcado sin indicar a quién: se puede indicar después */}
        {!product.soldTo && (
          <button type="button" className="link" onClick={openContacts}>¿A quién?</button>
        )}
        <button type="button" className="link" onClick={reopen}>↩️ Volver a publicar</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`btn btn--block sl-btn-soft-success ${className ?? ''}`}
      onClick={markCompleted}
    >
      ✅ Marcar como {doneLabel}
    </button>
  );
};

export default MarkCompletedButton;
