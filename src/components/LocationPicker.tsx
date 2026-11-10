import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { requestLocation } from '../redux/slices/location/locationSlice';
import {
  newPlacesSession,
  PlaceSuggestion,
  placesErrorMessage,
  placesService,
} from '../redux/services/placesService';
import { Modal, Spinner } from './ui';
import '../styles/products.css';

/** Ubicación elegida para el producto. Las coordenadas faltan si es la ya guardada (el backend no las devuelve). */
export type PickedLocation = {
  latitude?: number;
  longitude?: number;
  label: string; // "Barrio, Ciudad" — lo único que ven los compradores
  source: 'current' | 'search' | 'saved';
};

type Props = {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
  /** Al abrir, usar la ubicación actual si todavía no hay una (formulario de publicar). */
  autoDetect?: boolean;
};

const SEARCH_DELAY_MS = 350;
const MIN_CHARS = 3;

const SOURCE_TEXT: Record<PickedLocation['source'], string> = {
  current: 'Tu ubicación actual',
  search: 'Dirección que buscaste',
  saved: 'Ubicación guardada',
};

/**
 * Campo "Ubicación del producto": por defecto la ubicación actual del usuario;
 * con "Cambiar" se puede buscar otra dirección (Google Places, a través del backend).
 * Los compradores solo ven "Barrio, Ciudad".
 */
const LocationPicker = ({ value, onChange, autoDetect = false }: Props) => {
  const dispatch = useAppDispatch();
  const { coords, status } = useAppSelector(state => state.location);

  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null); // placeId que se está abriendo
  const [searchError, setSearchError] = useState<string | null>(null);
  const session = useRef(newPlacesSession());

  /* ---------- Ubicación actual ---------- */
  // Cada detección tiene un número; si el usuario elige otra dirección mientras tanto,
  // el resultado de la detección vieja se descarta (no pisa lo que eligió)
  const detectRun = useRef(0);

  const detectCurrentLocation = async () => {
    const run = ++detectRun.current;
    setDetecting(true);
    setDetectError(null);
    setBlocked(false);
    try {
      // Si ya la tenemos (el usuario la compartió antes) no se vuelve a pedir el permiso
      const here = coords ?? (await dispatch(requestLocation()).unwrap());
      let label = '';
      try {
        label = await placesService.reverse(here.latitude, here.longitude);
      } catch (err) {
        // Sin nombre de barrio igual sirve para "Cerca de ti"; se guarda el punto
        console.log('reverse geocode:', err);
      }
      if (run !== detectRun.current) return; // el usuario ya eligió otra
      onChange({ latitude: here.latitude, longitude: here.longitude, label, source: 'current' });
      setVisible(false);
    } catch (reason) {
      if (run !== detectRun.current) return;
      setBlocked(reason === 'blocked');
      setDetectError(
        reason === 'unavailable'
          ? 'No pudimos leer tu ubicación. Revisa que la ubicación esté activada o busca la dirección.'
          : reason === 'blocked'
            ? 'El navegador tiene bloqueada la ubicación para Bart. Actívala en la configuración del sitio o busca la dirección.'
            : 'Bart no tiene permiso de ubicación. Actívalo o busca la dirección.'
      );
    } finally {
      if (run === detectRun.current) setDetecting(false);
    }
  };

  // Por defecto: la ubicación actual (solo una vez, y solo si no hay ninguna elegida)
  const autoTried = useRef(false);
  useEffect(() => {
    if (!autoDetect || value || autoTried.current) return;
    autoTried.current = true;
    detectCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetect, value]);

  /* ---------- Buscar otra dirección ---------- */
  useEffect(() => {
    if (!visible) return;
    const text = query.trim();
    if (text.length < MIN_CHARS) {
      setSuggestions([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await placesService.autocomplete(text, session.current, coords);
        if (!cancelled) setSuggestions(results);
      } catch (err) {
        if (!cancelled) setSearchError(placesErrorMessage(err));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible, coords]);

  const openSearch = () => {
    session.current = newPlacesSession();
    setQuery('');
    setSuggestions([]);
    setSearchError(null);
    setVisible(true);
  };

  const choose = async (item: PlaceSuggestion) => {
    setResolving(item.placeId);
    setSearchError(null);
    try {
      const place = await placesService.details(item.placeId, session.current);
      // Cancela cualquier detección de "ubicación actual" que siga en curso
      detectRun.current++;
      setDetecting(false);
      // Si Google no da barrio/ciudad, se usa el texto de la sugerencia sin la calle
      onChange({ ...place, label: place.label || item.subtitle || item.title, source: 'search' });
      setVisible(false);
    } catch (err) {
      setSearchError(placesErrorMessage(err));
    } finally {
      setResolving(null);
      session.current = newPlacesSession(); // la sesión termina al elegir
    }
  };

  /* ---------- Vista del campo ---------- */
  const hasValue = !!value;
  const title = value ? value.label || 'Ubicación aproximada' : detecting ? 'Buscando tu ubicación…' : 'Sin ubicación';
  const subtitle = value
    ? SOURCE_TEXT[value.source]
    : detecting
      ? 'Un momento'
      : 'Usa tu ubicación actual o busca una dirección';
  const isBlocked = blocked || status === 'blocked';
  const trimmed = query.trim();

  return (
    <div>
      <div className="location-field">
        <span className={`icon-circle${hasValue ? ' icon-circle--on' : ''}`} aria-hidden>
          {detecting ? <Spinner small /> : '📍'}
        </span>
        <div className="location-field__texts">
          <p className="location-field__title">{title}</p>
          <p className="meta">{subtitle}</p>
        </div>
      </div>

      {/* Siempre se puede poner otra dirección: con ubicación ya elegida o mientras se busca la actual */}
      {(hasValue || detecting) && (
        <div className="location-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={openSearch}>
            ✏️ {hasValue ? 'Cambiar ubicación' : 'Escribir otra dirección'}
          </button>
        </div>
      )}

      {!!detectError && !hasValue && <p className="notice notice--warning">⚠️ {detectError}</p>}

      {!hasValue && !detecting && (
        <div className="location-actions">
          {/* En la web no se puede abrir la configuración del navegador: si está bloqueada, solo queda buscar */}
          {!isBlocked && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={detectCurrentLocation}>
              📍 Usar mi ubicación actual
            </button>
          )}
          <button type="button" className="btn btn--outline btn--sm" onClick={openSearch}>
            🔍 Buscar una dirección
          </button>
        </div>
      )}

      <p className="location-privacy">🔒 Los compradores solo verán el barrio y la ciudad, nunca la dirección exacta.</p>

      {/* ---------- Ventana de búsqueda ---------- */}
      <Modal open={visible} onClose={() => setVisible(false)} title="Ubicación del producto">
        <div className="search-field" style={{ marginBottom: 8 }}>
          <span className="search-field__icon" aria-hidden>🔍</span>
          <input
            type="search"
            className="input"
            placeholder="Escribe una dirección o barrio"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="search"
            aria-label="Buscar una dirección"
          />
          {searching && (
            <span style={{ position: 'absolute', right: 12 }}>
              <Spinner small />
            </span>
          )}
        </div>

        {!isBlocked && (
          <button type="button" className="place-row" onClick={detectCurrentLocation} disabled={detecting}>
            <span className="icon-circle icon-circle--on" aria-hidden>
              {detecting ? <Spinner small /> : '📍'}
            </span>
            <span className="place-row__texts">
              <span className="place-row__title" style={{ display: 'block' }}>Usar mi ubicación actual</span>
              {!!detectError && <span className="place-row__error" style={{ display: 'block' }}>{detectError}</span>}
            </span>
          </button>
        )}

        {!!searchError && <p className="notice notice--error">⚠️ {searchError}</p>}

        <div className="place-list">
          {suggestions.length > 0 ? (
            suggestions.map(item => (
              <button
                key={item.placeId}
                type="button"
                className="place-row"
                onClick={() => choose(item)}
                disabled={!!resolving}
              >
                <span className="icon-circle" aria-hidden>
                  {resolving === item.placeId ? <Spinner small /> : '🏠'}
                </span>
                <span className="place-row__texts">
                  <span className="place-row__title ellipsis" style={{ display: 'block' }}>{item.title}</span>
                  {!!item.subtitle && <span className="meta ellipsis" style={{ display: 'block' }}>{item.subtitle}</span>}
                </span>
              </button>
            ))
          ) : trimmed.length >= MIN_CHARS ? (
            !searching && !searchError && (
              <p className="hint" style={{ padding: '12px 6px' }}>
                No encontramos esa dirección. Prueba con el barrio o la ciudad.
              </p>
            )
          ) : (
            <p className="hint" style={{ padding: '12px 6px' }}>Escribe al menos {MIN_CHARS} letras para buscar.</p>
          )}
        </div>

        <button type="button" className="btn btn--ghost btn--block" onClick={() => setVisible(false)}>
          Cancelar
        </button>
      </Modal>
    </div>
  );
};

export default LocationPicker;
