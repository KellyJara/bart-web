import { PriceMode } from '../utils/productPrice';
import '../styles/products.css';

// Con precio | No sé cuánto pedir: recibir ofertas | Regalar
const PRICE_MODES: { value: PriceMode; label: string }[] = [
  { value: 'fixed', label: '💲 Con precio' },
  { value: 'offers', label: '💰 Recibir ofertas' },
  { value: 'gift', label: '🎁 Regalar' },
];

type Props = {
  value: PriceMode;
  onChange: (mode: PriceMode) => void;
};

/** ¿Cómo lo publicas? Precio fijo, sin precio (recibe ofertas) o regalo. */
const PriceModeSelector = ({ value, onChange }: Props) => (
  <div className="segment" role="radiogroup" aria-label="Tipo de precio">
    {PRICE_MODES.map(mode => {
      const selected = value === mode.value;
      return (
        <button
          key={mode.value}
          type="button"
          role="radio"
          aria-checked={selected}
          className={`segment__item${selected ? ' segment__item--selected' : ''}`}
          onClick={() => onChange(mode.value)}
        >
          {mode.label}
        </button>
      );
    })}
  </div>
);

export default PriceModeSelector;
