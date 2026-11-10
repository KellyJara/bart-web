import { useCallback, useEffect, useState } from 'react';
import { reviewService } from '../redux/services/reviewService';
import { getApiErrorMessage } from '../redux/services/requestService';
import { Review } from '../redux/types/review.type';
import { Stars } from './StarRating';
import { REVIEW_POINTS } from '../utils/levels';
import { showAlert } from '../utils/dialog';
import { Modal, Spinner } from './ui';
import '../styles/seller.css';

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

type Props = {
  productId: string;
  sellerName: string;
  onSaved?: () => void; // p. ej. recargar el producto para ver el nuevo promedio
};

/**
 * En el detalle del producto: si el vendedor marcó que te lo vendió o te lo regaló,
 * puedes calificarlo. Tu reseña le suma 50 puntos al vendedor (venta o regalo).
 */
const ReviewSellerSection = ({ productId, sellerName, onSaved }: Props) => {
  const [canReview, setCanReview] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reviewService.getMine(productId);
      setCanReview(res.data.canReview);
      setMyReview(res.data.review);
    } catch (err) {
      console.log('Error cargando reseña:', err);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canReview) return null;

  const open = () => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? '');
    setVisible(true);
  };

  const save = async () => {
    if (!rating) {
      showAlert('Calificación', 'Elige de 1 a 5 estrellas.');
      return;
    }
    setSaving(true);
    try {
      const res = await reviewService.save(productId, { rating, comment: comment.trim() });
      setMyReview(res.data.review);
      setVisible(false);
      onSaved?.();
      showAlert('¡Gracias!', 'Tu reseña ayuda a otras personas a confiar en este vendedor.');
    } catch (err) {
      showAlert('No se pudo guardar', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {myReview ? (
        <div className="card card--white">
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Tu reseña de {sellerName}</p>
          <Stars value={myReview.rating} size={20} />
          {!!myReview.comment && <p style={{ marginTop: 6 }}>{myReview.comment}</p>}
          <button type="button" className="link" style={{ marginTop: 8 }} onClick={open}>
            ✏️ Editar reseña
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--secondary btn--block" onClick={open}>
          ⭐ Calificar a {sellerName}
        </button>
      )}

      <Modal open={visible} onClose={() => setVisible(false)} title={`¿Cómo te fue con ${sellerName}?`}>
        <div style={{ textAlign: 'center' }}>
          <Stars value={rating} size={40} onChange={setRating} />
          <p
            className="meta"
            style={{ marginTop: 6, ...(rating ? { color: 'var(--star)', fontWeight: 700 } : null) }}
          >
            {LABELS[rating] || 'Toca las estrellas'}
          </p>
        </div>

        <textarea
          className="textarea"
          placeholder="Cuéntale a otros cómo fue el trato (opcional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
        />
        <span className="sl-counter">{comment.length}/500</span>

        {!myReview && (
          <p className="hint" style={{ textAlign: 'center' }}>
            🏅 Con tu reseña, {sellerName} gana {REVIEW_POINTS} puntos en su perfil.
          </p>
        )}

        <button
          type="button"
          className="btn btn--block"
          onClick={save}
          disabled={saving}
          style={rating ? undefined : { opacity: 0.5 }}
        >
          {saving ? <Spinner small /> : myReview ? 'Guardar cambios' : 'Enviar reseña'}
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setVisible(false)}>
          Cancelar
        </button>
      </Modal>
    </div>
  );
};

export default ReviewSellerSection;
