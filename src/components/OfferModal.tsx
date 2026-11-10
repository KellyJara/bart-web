import { FormEvent, useEffect, useState } from 'react';
import { Product } from '../redux/types/product.type';
import { formatPrice, formatPriceInput, parsePrice } from '../utils/currency';
import { showAlert } from '../utils/dialog';
import { buildOfferMessage, contactSellerAboutProduct } from '../utils/whatsapp';
import { isPriceOpen } from '../utils/productPrice';
import { Modal } from './ui';
import '../styles/products.css';

type Props = {
  open: boolean;
  onClose: () => void;
  product: Pick<Product, '_id' | 'name' | 'price' | 'priceOpen' | 'owner'>;
};

/**
 * "Hacer una oferta": pregunta cuánto ofrece, la registra (el vendedor la ve en
 * "Contactos por WhatsApp") y abre WhatsApp con el mensaje.
 * Bart no puede saber si el mensaje se envió de verdad.
 */
const OfferModal = ({ open, onClose, product }: Props) => {
  const [amount, setAmount] = useState('');

  // Cada vez que se abre empieza vacío
  useEffect(() => {
    if (open) setAmount('');
  }, [open]);

  const value = parsePrice(amount);

  const sendOffer = (e: FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(value) || value <= 0) {
      showAlert('Precio inválido', 'Ingresa cuánto quieres ofrecer.');
      return;
    }
    const sellerName = product.owner?.username ?? 'vendedor';
    onClose();
    contactSellerAboutProduct(product._id, sellerName, buildOfferMessage(sellerName, product.name, value), value);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hacer una oferta"
      subtitle={`${product.name}${isPriceOpen(product) ? ' · Sin precio fijo' : ` · Precio: ${formatPrice(product.price)}`}`}
    >
      <form className="stack" onSubmit={sendOffer}>
        <div>
          <label className="label" htmlFor="offer-amount">Tu oferta</label>
          <div className="price-input">
            <span className="price-input__prefix" aria-hidden>$</span>
            <input
              id="offer-amount"
              className="input"
              placeholder="¿Cuánto ofreces? (COP)"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={e => setAmount(formatPriceInput(e.target.value))}
            />
          </div>
        </div>

        <p className="hint">💬 Se abrirá WhatsApp con tu oferta escrita para el vendedor.</p>

        {/* Desactivado hasta escribir cuánto ofrece */}
        <button type="submit" className="btn btn--whatsapp btn--block" disabled={!(value > 0)}>
          💬 Enviar por WhatsApp
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onClose}>
          Cancelar
        </button>
      </form>
    </Modal>
  );
};

export default OfferModal;
