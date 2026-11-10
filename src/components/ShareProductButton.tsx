import { useState } from 'react';
import {
  canUseSystemShare,
  copyProductLink,
  ShareableProduct,
  shareOnFacebook,
  shareOnTelegram,
  shareOnWhatsApp,
  shareOnX,
  shareWithSystem,
} from '../utils/shareProduct';
import { Modal } from './ui';

type Props = {
  product: ShareableProduct;
  label?: string;
  small?: boolean;
};

const OPTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', badge: 'W', color: '#25D366', action: shareOnWhatsApp },
  { key: 'facebook', label: 'Facebook', badge: 'f', color: '#1877F2', action: shareOnFacebook },
  { key: 'telegram', label: 'Telegram', badge: 'T', color: '#229ED9', action: shareOnTelegram },
  { key: 'x', label: 'X (Twitter)', badge: 'X', color: '#000000', action: shareOnX },
  { key: 'copy', label: 'Copiar enlace', badge: '🔗', color: '#8B3A2E', action: copyProductLink },
];

const ShareProductButton = ({ product, label = 'Compartir', small }: Props) => {
  const [visible, setVisible] = useState(false);

  const handleShare = async (action: (p: ShareableProduct) => Promise<void>) => {
    setVisible(false);
    try {
      await action(product);
    } catch (err) {
      console.log('Error al compartir:', err);
    }
  };

  // "Más opciones..." solo donde el navegador tiene menú de compartir (celulares)
  const options = canUseSystemShare()
    ? [...OPTIONS, { key: 'more', label: 'Más opciones...', badge: '•••', color: '#6B4F4F', action: shareWithSystem }]
    : OPTIONS;

  return (
    <>
      <button
        type="button"
        className={`btn btn--outline btn--block${small ? ' btn--sm' : ''}`}
        onClick={() => setVisible(true)}
      >
        📤 {label}
      </button>

      <Modal open={visible} onClose={() => setVisible(false)} title="Compartir producto" subtitle={product.name}>
        <div>
          {options.map(option => (
            <button key={option.key} type="button" className="option-row" onClick={() => handleShare(option.action)}>
              <span className="option-row__badge" style={{ backgroundColor: option.color }}>{option.badge}</span>
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setVisible(false)}>
          Cancelar
        </button>
      </Modal>
    </>
  );
};

export default ShareProductButton;
