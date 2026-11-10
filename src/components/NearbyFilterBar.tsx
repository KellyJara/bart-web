import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  ListingType,
  requestLocation,
  setCategoryFilter,
  setListingType,
  setRadius,
} from '../redux/slices/location/locationSlice';
import { CATEGORIES } from '../constants/categories';
import { Chip, Spinner } from './ui';
import '../styles/products.css';

const RADIUS_OPTIONS: { value: number | null; label: string }[] = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: null, label: 'Todos' },
];

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'sale', label: 'En venta' },
  { value: 'gift', label: 'Regalado' },
];

// Mensaje y botón cuando no tenemos la ubicación del usuario
const LocationBanner = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.location.status);

  if (status === 'loading') {
    return (
      <div className="row">
        <Spinner small />
        <span className="meta">Obteniendo tu ubicación...</span>
      </div>
    );
  }

  const isBlocked = status === 'blocked';
  const message =
    status === 'unavailable'
      ? 'No pudimos obtener tu ubicación. Revisa tu conexión o que la ubicación esté activada.'
      : isBlocked
        ? 'El permiso de ubicación está bloqueado en el navegador. Actívalo en la configuración del sitio (el ícono junto a la dirección) y recarga la página.'
        : 'Comparte tu ubicación aproximada para ver productos que se venden o se regalan cerca de ti. Nunca se muestra a otras personas.';

  return (
    <div className="location-banner">
      <div className="location-banner__header">
        <span className="icon-circle" aria-hidden>📍</span>
        <p>{message}</p>
      </div>
      {/* En la web no se puede abrir la configuración del navegador desde la página */}
      {!isBlocked && (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => dispatch(requestLocation())}
        >
          {status === 'unavailable' ? 'Reintentar' : 'Usar mi ubicación'}
        </button>
      )}
    </div>
  );
};

const NearbyFilterBar = () => {
  const dispatch = useAppDispatch();
  const { status, radiusKm, listingType, category } = useAppSelector(state => state.location);

  return (
    <div className="filters">
      {status === 'granted' ? (
        <>
          <span className="filters__title">📍 Cerca de ti</span>
          <div className="chips chips--scroll">
            {RADIUS_OPTIONS.map(option => (
              <Chip
                key={option.label}
                label={option.label}
                selected={radiusKm === option.value}
                onPress={() => dispatch(setRadius(option.value))}
              />
            ))}
          </div>
        </>
      ) : (
        <LocationBanner />
      )}

      {/* Venta / regalo: control segmentado */}
      <div className="segment" role="group" aria-label="Tipo de publicación">
        {TYPE_OPTIONS.map(option => {
          const selected = listingType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`segment__item${selected ? ' segment__item--selected' : ''}`}
              aria-pressed={selected}
              onClick={() => dispatch(setListingType(option.value))}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Categorías: fila deslizable */}
      <span className="filters__title">Categorías</span>
      <div className="chips chips--scroll">
        <Chip
          label="Todas"
          selected={category === null}
          onPress={() => dispatch(setCategoryFilter(null))}
        />
        {CATEGORIES.map(c => (
          <Chip
            key={c.key}
            label={`${c.icon} ${c.label}`}
            selected={category === c.key}
            onPress={() => dispatch(setCategoryFilter(category === c.key ? null : c.key))}
          />
        ))}
      </div>
    </div>
  );
};

export default NearbyFilterBar;
