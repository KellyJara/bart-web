import { FormEvent, useCallback, useEffect, useState } from 'react';
import { supportService } from '../../redux/services/supportService';
import { getApiErrorMessage } from '../../redux/services/requestService';
import { PqrType, SupportTicket } from '../../redux/types/support.type';
import { formatDate } from '../../utils/format';
import { showAlert } from '../../utils/dialog';
import { BackButton, Chip, Spinner } from '../../components/ui';
import '../../styles/seller.css';

const PQR_TYPES: { value: PqrType; label: string }[] = [
  { value: 'peticion', label: '🙏 Petición' },
  { value: 'queja', label: '😕 Queja' },
  { value: 'reclamo', label: '⚠️ Reclamo' },
  { value: 'sugerencia', label: '💡 Sugerencia' },
];

const PQR_LABELS: Record<PqrType, string> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
};

/**
 * Ayuda y reportes: enviar una PQR (petición, queja, reclamo o sugerencia)
 * y ver el historial de reportes y mensajes enviados.
 */
const SupportScreen = () => {
  const [type, setType] = useState<PqrType>('peticion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const loadTickets = useCallback(async () => {
    try {
      const res = await supportService.getMine();
      setTickets(res.data);
    } catch (err) {
      console.log('Error cargando historial de soporte:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Cargar al entrar y al volver a la pestaña (p. ej. después de reportar a alguien)
  useEffect(() => {
    loadTickets();
    const onVisible = () => document.visibilityState === 'visible' && loadTickets();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadTickets]);

  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  const sendPqr = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const res = await supportService.createPqr({
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject('');
      setMessage('');
      showAlert('Mensaje enviado', res.data.message);
      loadTickets();
    } catch (err) {
      showAlert('No se pudo enviar', getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 12 }}>Ayuda y reportes</h1>

      <div className="sl-banner">
        <span className="sl-banner__icon">🚩</span>
        <span>
          Para reportar un producto o a un usuario, abre su página y toca "Reportar". Aquí puedes escribirnos
          por cualquier otro motivo.
        </span>
      </div>

      {/* ---------- FORMULARIO PQR ---------- */}
      <h2 className="section-title">Escríbenos</h2>
      <form className="card card--white section" onSubmit={sendPqr}>
        <p className="hint" style={{ marginBottom: 12 }}>Te responderemos al correo de tu cuenta.</p>

        <div className="field">
          <span className="label">¿Qué quieres enviarnos?</span>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {PQR_TYPES.map(t => (
              <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="pqr-subject">Asunto</label>
          <input
            id="pqr-subject"
            className="input"
            placeholder="Resume tu mensaje en pocas palabras"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={150}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="pqr-message">Mensaje</label>
          <textarea
            id="pqr-message"
            className="textarea"
            style={{ minHeight: 140 }}
            placeholder="Cuéntanos con detalle"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={2000}
          />
          <span className="sl-counter">{message.length}/2000</span>
        </div>

        <button type="submit" className="btn btn--block" disabled={!canSend || sending}>
          {sending ? <Spinner small /> : '✉️ Enviar'}
        </button>
      </form>

      {/* ---------- HISTORIAL ---------- */}
      <section>
        <h2 className="section-title">
          Mis reportes y mensajes{tickets.length > 0 ? ` (${tickets.length})` : ''}
        </h2>
        {loadingTickets ? (
          <div className="row" style={{ justifyContent: 'center', padding: 16 }}>
            <Spinner small />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty" style={{ paddingTop: 24 }}>
            <div className="sl-empty-emoji">📋</div>
            <p className="sl-empty-title">Sin mensajes todavía</p>
            <p>Todavía no has enviado reportes ni mensajes.</p>
          </div>
        ) : (
          <div className="list">
            {tickets.map(ticket => {
              const isReport = ticket.kind === 'user_report';
              const title = isReport
                ? `🚩 Reporte a ${ticket.reportedUser?.username ?? 'usuario eliminado'}`
                : `${PQR_LABELS[ticket.pqrType ?? 'peticion']}: ${ticket.subject}`;
              const isOpen = ticket.status === 'open';
              return (
                <div key={ticket._id} className="card card--white">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <p className="grow sl-clamp-2" style={{ fontWeight: 700 }}>{title}</p>
                    <span className={`sl-tag ${isOpen ? 'sl-tag--primary' : 'sl-tag--success'}`}>
                      {isOpen ? 'En revisión' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="meta">
                    {formatDate(ticket.createdAt)}
                    {isReport && ticket.reason ? ` · ${ticket.reason}` : ''}
                  </p>
                  {!!ticket.message && (
                    <p className="sl-clamp-3" style={{ marginTop: 6 }}>{ticket.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default SupportScreen;
