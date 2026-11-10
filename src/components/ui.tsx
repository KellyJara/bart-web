import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { closeDialog, Dialog, subscribeDialogs } from '../utils/dialog';
import { DEFAULT_AVATAR_URL } from '../utils/format';

export const Spinner = ({ small }: { small?: boolean }) => (
  <span className={`spinner${small ? ' spinner--sm' : ''}`} role="status" aria-label="Cargando" />
);

export const PageLoader = () => (
  <div className="center">
    <Spinner />
  </div>
);

type ChipProps = { label: string; selected: boolean; onPress: () => void };

export const Chip = ({ label, selected, onPress }: ChipProps) => (
  <button
    type="button"
    className={`chip${selected ? ' chip--selected' : ''}`}
    onClick={onPress}
    aria-pressed={selected}
  >
    {label}
  </button>
);

type SwitchRowProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

// Fila con texto e interruptor (equivale a Switch de React Native)
export const SwitchRow = ({ title, subtitle, value, disabled, onChange }: SwitchRowProps) => (
  <label className="switch-row">
    <span className="grow">
      <span style={{ display: 'block', fontWeight: 600 }}>{title}</span>
      {subtitle && <span className="hint" style={{ display: 'block' }}>{subtitle}</span>}
    </span>
    <input
      type="checkbox"
      className="switch"
      checked={value}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
    />
  </label>
);

export const Avatar = ({ src, size = 40, ring }: { src?: string | null; size?: number; ring?: boolean }) => (
  <img
    src={src || DEFAULT_AVATAR_URL}
    alt=""
    width={size}
    height={size}
    className={`avatar${ring ? ' avatar--ring' : ''}`}
    style={{ width: size, height: size }}
    onError={e => {
      if (e.currentTarget.src !== DEFAULT_AVATAR_URL) e.currentTarget.src = DEFAULT_AVATAR_URL;
    }}
  />
);

export const BackButton = ({ label = 'Volver' }: { label?: string }) => {
  const navigate = useNavigate();
  return (
    <button type="button" className="back-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
      ‹ {label}
    </button>
  );
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Ventana sobre la página: hoja inferior en celular y diálogo centrado en escritorio.
 * Se cierra con Escape o tocando fuera.
 */
export const Modal = ({ open, onClose, title, subtitle, children }: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        {title && <h2 className="modal__title">{title}</h2>}
        {subtitle && <p className="modal__subtitle">{subtitle}</p>}
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

/** Muestra los diálogos de showAlert (reemplazo de Alert.alert). */
export const DialogHost = () => {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  useEffect(() => subscribeDialogs(setDialogs), []);

  const dialog = dialogs[0];
  useEffect(() => {
    if (!dialog) return;
    const cancel = dialog.buttons.find(b => b.style === 'cancel');
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      closeDialog(dialog.id);
      cancel?.onPress?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  if (!dialog) return null;

  const press = (onPress?: () => void) => {
    closeDialog(dialog.id);
    onPress?.();
  };

  return createPortal(
    <div className="modal-backdrop" style={{ alignItems: 'center', zIndex: 60 }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={`dialog-${dialog.id}`}>
        <h2 className="dialog__title" id={`dialog-${dialog.id}`}>{dialog.title}</h2>
        {dialog.message && <p className="dialog__message">{dialog.message}</p>}
        <div className="dialog__actions">
          {dialog.buttons.map((b, i) => (
            <button
              key={b.text}
              type="button"
              autoFocus={i === dialog.buttons.length - 1}
              className={`dialog__btn${b.style && b.style !== 'default' ? ` dialog__btn--${b.style}` : ''}`}
              onClick={() => press(b.onPress)}
            >
              {b.text}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};
