import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchInbox,
  fetchUnreadCount,
  InboxNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../redux/slices/inbox/inboxSlice';
import { openNotificationTarget } from '../../utils/notifications';
import { timeAgo } from '../../utils/format';
import { PageLoader, Spinner } from '../../components/ui';
import '../../styles/profile.css';

// Ícono según el evento (lo envía el backend en data.event)
const EVENT_ICONS: Record<string, string> = {
  contact_received: '💬', // alguien quiere tu producto (abrió WhatsApp)
  offer_received: '💰',
  application_received: '🙋',
  accepted: '🎉',
  rejected: '🙁',
  reserved_other: '🔒',
  released: '🔓',
  completed_other: '🚫', // ya fue vendido/regalado a otra persona
  review_received: '⭐',
  deal_recipient: '🎁', // te vendieron/regalaron un producto: califica al vendedor
};
const iconFor = (n: InboxNotification) =>
  n.type === 'message' ? '💬' : EVENT_ICONS[n.data.event ?? ''] ?? '🔔';

const NotificationsScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, hasMore, unreadCount } = useAppSelector(state => state.inbox);

  const refresh = useCallback(() => {
    dispatch(fetchInbox());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const open = (n: InboxNotification) => {
    if (!n.read) dispatch(markNotificationRead(n._id));
    openNotificationTarget(navigate, n.data);
  };

  const loadMore = () => {
    if (loading || !hasMore || items.length === 0) return;
    dispatch(fetchInbox({ before: items[items.length - 1].updatedAt }));
  };

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <h1 className="page-title grow">Notificaciones</h1>
        {unreadCount > 0 && (
          <button type="button" className="link" onClick={() => dispatch(markAllNotificationsRead())}>
            Marcar todas
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <p className="empty">
          <span style={{ fontSize: 32 }}>🔔</span><br />
          <strong style={{ color: 'var(--text)' }}>No tienes notificaciones</strong><br />
          Aquí verás tus mensajes, ofertas y cuando te asignen un producto.
        </p>
      ) : (
        <>
          <div className="stack" style={{ gap: 4 }}>
            {items.map(item => (
              <button
                key={item._id}
                type="button"
                className={`notif${item.read ? '' : ' notif--unread'}`}
                onClick={() => open(item)}
              >
                <span className="notif__icon" aria-hidden>{iconFor(item)}</span>
                <span className="grow">
                  <span className="ellipsis" style={{ display: 'block', fontWeight: item.read ? 500 : 800 }}>
                    {item.type === 'message' && item.count > 1 ? `${item.title} · ${item.count} mensajes` : item.title}
                  </span>
                  <span className="meta notif__body">{item.body}</span>
                  <span className="hint">{timeAgo(item.updatedAt)}</span>
                </span>
                {!item.read && <span className="notif__dot" aria-label="Sin leer" />}
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
              {loading ? (
                <Spinner small />
              ) : (
                <button type="button" className="btn btn--outline btn--sm" onClick={loadMore}>Ver anteriores</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsScreen;
