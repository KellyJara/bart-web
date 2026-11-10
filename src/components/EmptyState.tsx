import React from 'react';
import '../styles/products.css';

type Props = {
  emoji?: string;
  title: string;
  message?: React.ReactNode;
  action?: React.ReactNode;
};

/** Estado vacío (equivale a EmptyState del sistema de diseño de la app). */
const EmptyState = ({ emoji, title, message, action }: Props) => (
  <div className="empty-state">
    {emoji && <span className="empty-state__emoji" aria-hidden>{emoji}</span>}
    <p className="empty-state__title">{title}</p>
    {message && <p className="empty-state__message">{message}</p>}
    {action}
  </div>
);

export default EmptyState;
