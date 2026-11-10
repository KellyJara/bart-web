import { useState } from 'react';
import { CATEGORIES, getCategory } from '../constants/categories';
import { Modal } from './ui';
import '../styles/products.css';

type Props = {
  value?: string;
  onChange: (key: string) => void;
};

/**
 * Campo para elegir la categoría de una lista (en lugar de escribirla).
 * Al tocarlo abre una cuadrícula con todas las categorías.
 */
const CategoryPicker = ({ value, onChange }: Props) => {
  const [visible, setVisible] = useState(false);
  const selected = getCategory(value);

  const choose = (key: string) => {
    onChange(key);
    setVisible(false);
  };

  return (
    <>
      <button
        type="button"
        className="select-field"
        onClick={() => setVisible(true)}
        aria-label={selected ? `Categoría: ${selected.label}` : 'Elige una categoría'}
      >
        {selected ? (
          <span className="category-field__value">
            <span className="category-field__icon" aria-hidden>{selected.icon}</span>
            <span className="ellipsis">{selected.label}</span>
          </span>
        ) : (
          <span className="placeholder">Elige una categoría</span>
        )}
        <span aria-hidden>▾</span>
      </button>

      <Modal open={visible} onClose={() => setVisible(false)} title="Elige una categoría">
        <div className="category-grid">
          {CATEGORIES.map(category => (
            <button
              key={category.key}
              type="button"
              className={`category-item${value === category.key ? ' category-item--selected' : ''}`}
              onClick={() => choose(category.key)}
              aria-pressed={value === category.key}
            >
              <span className="category-item__icon">{category.icon}</span>
              {category.label}
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

export default CategoryPicker;
