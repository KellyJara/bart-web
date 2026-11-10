import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AdminReport, DailyRow, reportService } from '../../redux/services/reportService';
import BarChart, { BarDatum } from '../../components/charts/BarChart';
import { PageLoader } from '../../components/ui';
import '../../styles/seller.css';

type Period = '7' | '30' | '90';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
  { value: '90', label: '90 días' },
];

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// "2026-11-08" -> "8 nov"
const shortDay = (day: string) => {
  const [, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const toBars = (daily: DailyRow[], value: (r: DailyRow) => number): BarDatum[] =>
  daily.map(r => ({ key: r.day, label: shortDay(r.day), value: value(r) }));

/** Tarjeta de cifra: número grande + qué es + una nota (total histórico, etc.). */
const StatTile = ({ icon, label, value, caption }: { icon: string; label: string; value: number; caption: string }) => (
  <div className="sl-tile">
    <div className="sl-tile__icon" aria-hidden>{icon}</div>
    <div className="sl-tile__value">{value}</div>
    <div className="sl-tile__label">{label}</div>
    <div className="sl-tile__caption">{caption}</div>
  </div>
);

const InfoBanner = ({ icon = 'ℹ️', tone, children }: { icon?: string; tone?: 'error'; children: ReactNode }) => (
  <div className={`sl-banner${tone ? ` sl-banner--${tone}` : ''}`}>
    <span className="sl-banner__icon">{icon}</span>
    <span>{children}</span>
  </div>
);

const SectionHead = ({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) => (
  <div className="sl-section-head">
    <h3 className="section-title">{title}</h3>
    {action && (
      <button type="button" className="link" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <SectionHead title={title} />
    <div className="card card--white">{children}</div>
  </div>
);

/**
 * Informe para administradores, por día:
 *  - Usuarios: nuevos, personas que iniciaron sesión y usuarios activos.
 *  - Actividad: artículos publicados, mensajes y ofertas por WhatsApp, vendidos y regalados.
 */
const AdminReportScreen = () => {
  const [period, setPeriod] = useState<Period>('30');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [showUsersTable, setShowUsersTable] = useState(false);

  const load = useCallback(async (days: Period) => {
    setLoading(true);
    try {
      setReport(await reportService.getAdmin(Number(days)));
      setError(null);
    } catch (err: any) {
      setError(
        err?.response?.status === 403
          ? 'Este informe es solo para administradores.'
          : err?.response?.status === 404
            ? 'El servidor no tiene el informe todavía. Reinicia el backend.'
            : 'No se pudo cargar el informe. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al entrar y al cambiar el periodo
  useEffect(() => {
    load(period);
  }, [load, period]);

  const header = (
    <div className="sl-header">
      <h1 className="page-title">📊 Informe</h1>
      <button type="button" className="btn btn--outline btn--sm" onClick={() => load(period)} disabled={loading}>
        ↻ Actualizar
      </button>
    </div>
  );

  if (loading && !report && !error) {
    return (
      <div className="page">
        {header}
        <PageLoader />
      </div>
    );
  }

  const daily = report?.daily ?? [];
  const totals = report?.totals;
  const allTime = report?.allTime;
  const users = report?.users;

  return (
    <div className="page">
      {header}

      {/* Periodo */}
      <div className="sl-segmented" role="group" aria-label="Periodo">
        {PERIODS.map(p => (
          <button key={p.value} type="button" aria-pressed={period === p.value} onClick={() => setPeriod(p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {error && !report ? (
        <div className="empty">
          <div className="sl-empty-emoji">📊</div>
          <p className="sl-empty-title">Sin informe</p>
          <p>{error}</p>
        </div>
      ) : report && totals && allTime && users ? (
        <>
          {!!error && <InfoBanner icon="⚠️" tone="error">{error}</InfoBanner>}
          <p className="meta" style={{ marginBottom: 12 }}>
            Del {shortDay(report.from)} al {shortDay(report.to)}
            {loading ? '  ·  actualizando…' : ''}
          </p>

          {/* ================= USUARIOS ================= */}
          <h2 className="section-title">Usuarios</h2>
          <div className="sl-tiles">
            <StatTile icon="🆕" label="Usuarios nuevos" value={users.newUsers} caption={`De ${users.total} registrados`} />
            <StatTile icon="📱" label="Usuarios activos" value={users.activeUsers} caption="Personas distintas" />
            <StatTile icon="🔑" label="Iniciaron sesión" value={users.loginUsers} caption="Personas distintas" />
          </div>
          {!report.usersTrackedSince && (
            <InfoBanner>
              Los inicios de sesión y los usuarios activos se cuentan a partir de ahora. Los usuarios nuevos sí
              incluyen el historial.
            </InfoBanner>
          )}
          <p className="sl-note">
            Activos: personas que usaron la app ese día con su sesión iniciada (aunque no hayan vuelto a iniciar
            sesión). Cada persona cuenta una vez por día.
          </p>

          <div className="sl-charts">
            <ChartCard title="Usuarios nuevos por día">
              <BarChart
                data={toBars(daily, r => r.newUsers)}
                formatValue={v => plural(v, 'usuario nuevo', 'usuarios nuevos')}
              />
            </ChartCard>
            <ChartCard title="Usuarios activos por día">
              <BarChart
                data={toBars(daily, r => r.activeUsers)}
                formatValue={v => plural(v, 'persona activa', 'personas activas')}
              />
            </ChartCard>
            <ChartCard title="Personas que iniciaron sesión por día">
              <BarChart data={toBars(daily, r => r.logins)} formatValue={v => plural(v, 'persona', 'personas')} />
            </ChartCard>
          </div>

          <SectionHead
            title="Usuarios por día"
            action={{ label: showUsersTable ? 'Ocultar' : 'Ver tabla', onClick: () => setShowUsersTable(v => !v) }}
          />
          {showUsersTable && (
            <div className="sl-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Nuevos</th>
                    <th>Activos</th>
                    <th>Sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map(r => (
                    <tr key={r.day}>
                      <td>{shortDay(r.day)}</td>
                      <td className={r.newUsers ? undefined : 'sl-zero'}>{r.newUsers}</td>
                      <td className={r.activeUsers ? undefined : 'sl-zero'}>{r.activeUsers}</td>
                      <td className={r.logins ? undefined : 'sl-zero'}>{r.logins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= ACTIVIDAD ================= */}
          <h2 className="section-title sl-group-title">Productos y WhatsApp</h2>
          <div className="sl-tiles">
            <StatTile icon="🛍️" label="Artículos publicados" value={totals.published} caption={`Total: ${allTime.published}`} />
            <StatTile icon="💬" label="Mensajes por WhatsApp" value={totals.messages} caption={`Total: ${allTime.messages}`} />
            <StatTile icon="💰" label="Ofertas por WhatsApp" value={totals.offers} caption={`Total: ${allTime.offers}`} />
            <StatTile icon="✅" label="Vendidos" value={totals.sold} caption={`Total: ${allTime.sold}`} />
            <StatTile icon="🎁" label="Regalados" value={totals.gifted} caption={`Total: ${allTime.gifted}`} />
          </div>

          {!report.contactsTrackedSince && (
            <InfoBanner>
              El conteo diario de mensajes y ofertas empieza a partir de ahora. Los totales incluyen lo anterior.
            </InfoBanner>
          )}
          <p className="sl-note">
            Mensajes y ofertas cuentan cada vez que alguien toca el botón de WhatsApp en Bart; no es posible saber
            si el mensaje se envió.
          </p>

          {/* ---------- Gráficas por día (una medida por gráfica) ---------- */}
          <div className="sl-charts">
            <ChartCard title="Artículos publicados por día">
              <BarChart
                data={toBars(daily, r => r.published)}
                formatValue={v => plural(v, 'publicado', 'publicados')}
              />
            </ChartCard>
            <ChartCard title="Mensajes y ofertas por WhatsApp">
              <BarChart
                data={toBars(daily, r => r.messages + r.offers)}
                formatValue={v => plural(v, 'contacto', 'contactos')}
              />
            </ChartCard>
            <ChartCard title="Vendidos y regalados por día">
              <BarChart
                data={toBars(daily, r => r.sold + r.gifted)}
                formatValue={v => plural(v, 'producto', 'productos')}
              />
            </ChartCard>
          </div>

          {/* ---------- Tabla por día ---------- */}
          <SectionHead
            title="Productos y WhatsApp por día"
            action={{ label: showTable ? 'Ocultar' : 'Ver tabla', onClick: () => setShowTable(s => !s) }}
          />
          {showTable ? (
            <div className="sl-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th title="Publicados">Publ.</th>
                    <th title="Mensajes">Msj.</th>
                    <th title="Ofertas">Ofer.</th>
                    <th title="Vendidos">Vend.</th>
                    <th title="Regalados">Reg.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map(r => (
                    <tr key={r.day}>
                      <td>{shortDay(r.day)}</td>
                      <td className={r.published ? undefined : 'sl-zero'}>{r.published}</td>
                      <td className={r.messages ? undefined : 'sl-zero'}>{r.messages}</td>
                      <td className={r.offers ? undefined : 'sl-zero'}>{r.offers}</td>
                      <td className={r.sold ? undefined : 'sl-zero'}>{r.sold}</td>
                      <td className={r.gifted ? undefined : 'sl-zero'}>{r.gifted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <button type="button" className="link meta" onClick={() => setShowTable(true)}>
              Toca "Ver tabla" para ver cada día con todas las cifras.
            </button>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdminReportScreen;
