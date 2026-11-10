import { useState } from 'react';
import { supportService } from '../redux/services/supportService';
import { getApiErrorMessage } from '../redux/services/requestService';
import { showAlert } from '../utils/dialog';
import { Modal, Spinner } from './ui';
import '../styles/seller.css';

const REASONS = {
  product: [
    'Contenido inapropiado u ofensivo',
    'Producto prohibido o ilegal',
    'Posible estafa o fraude',
    'Información falsa o engañosa',
    'Spam o publicación repetida',
    'Otro',
  ],
  user: [
    'Estafa o fraude',
    'Acoso o lenguaje ofensivo',
    'Se hace pasar por otra persona',
    'No cumplió lo acordado',
    'Spam',
    'Otro',
  ],
};

type Props = {
  target: 'product' | 'user';
  targetId: string;
  targetName: string;
};

/**
 * Enlace "Reportar" que abre un formulario con motivos predefinidos.
 * El reporte llega al equipo de soporte para revisión.
 */
const ReportButton = ({ target, targetId, targetName }: Props) => {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [sending, setSending] = useState(false);

  const isProduct = target === 'product';
  const needsComments = reason === 'Otro';
  const canSubmit = !!reason && (!needsComments || comments.trim().length > 0);

  const close = () => {
    setVisible(false);
    setReason(null);
    setComments('');
  };

  const submit = async () => {
    if (!reason) return;
    setSending(true);
    try {
      const data = { reason, comments: comments.trim() || undefined };
      if (isProduct) {
        await supportService.reportProduct(targetId, data);
      } else {
        await supportService.reportUser(targetId, data);
      }
      close();
      showAlert(
        'Gracias por reportar',
        'Nuestro equipo lo revisará. Tu reporte es confidencial: la otra persona no sabrá quién lo envió.'
      );
    } catch (err) {
      showAlert('No se pudo enviar', getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button type="button" className="link" style={{ color: 'var(--accent)', alignSelf: 'center' }} onClick={() => setVisible(true)}>
        🚩 {isProduct ? 'Reportar este producto' : 'Reportar a este usuario'}
      </button>

      <Modal
        open={visible}
        onClose={close}
        title={isProduct ? 'Reportar producto' : 'Reportar usuario'}
        subtitle={targetName}
      >
        <span className="label" style={{ marginBottom: 0 }}>¿Cuál es el problema?</span>
        {REASONS[target].map(r => (
          <button
            key={r}
            type="button"
            className={`reason${reason === r ? ' reason--selected' : ''}`}
            onClick={() => setReason(r)}
            aria-pressed={reason === r}
          >
            {r}
          </button>
        ))}

        <textarea
          className="textarea"
          placeholder={needsComments ? 'Cuéntanos qué pasó (obligatorio)' : 'Detalles adicionales (opcional)'}
          value={comments}
          onChange={e => setComments(e.target.value)}
          maxLength={1000}
        />

        <button type="button" className="btn btn--danger btn--block" onClick={submit} disabled={!canSubmit || sending}>
          {sending ? <Spinner small /> : 'Enviar reporte'}
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={close}>
          Cancelar
        </button>
        <p className="sl-footnote">Tu reporte es confidencial: la otra persona no sabrá quién lo envió.</p>
      </Modal>
    </>
  );
};

export default ReportButton;
