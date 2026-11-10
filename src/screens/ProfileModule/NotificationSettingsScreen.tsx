import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchNotificationSettings,
  NotificationSettingsUpdate,
  updateNotificationSettings,
} from '../../redux/slices/notification/notificationSlice';
import { requestLocation } from '../../redux/slices/location/locationSlice';
import { showAlert } from '../../utils/dialog';
import { BackButton, Chip, PageLoader, SwitchRow } from '../../components/ui';
import '../../styles/profile.css';

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

const NotificationSettingsScreen = () => {
  const dispatch = useAppDispatch();
  const { settings, loading } = useAppSelector(state => state.notifications);

  useEffect(() => {
    dispatch(fetchNotificationSettings());
  }, [dispatch]);

  const save = async (update: NotificationSettingsUpdate) => {
    try {
      await dispatch(updateNotificationSettings(update)).unwrap();
    } catch {
      showAlert('Error', 'No se pudo guardar la configuración');
      dispatch(fetchNotificationSettings());
    }
  };

  // Para avisar de productos cercanos necesitamos la ubicación aproximada
  const shareLocation = async () => {
    try {
      const coords = await dispatch(requestLocation()).unwrap();
      await save({ location: coords });
      return true;
    } catch {
      showAlert(
        'Ubicación necesaria',
        'Para avisarte de productos cerca necesitamos tu ubicación aproximada. Actívala para este sitio en la configuración del navegador.',
      );
      return false;
    }
  };

  const toggleNearby = async (value: boolean) => {
    if (value && !settings?.hasLocation) {
      const ok = await shareLocation();
      if (!ok) return;
    }
    save({ nearbyProducts: value });
  };

  if (loading && !settings) return <PageLoader />;

  if (!settings) {
    return (
      <div className="center">
        <p style={{ fontSize: 16, fontWeight: 700 }}>😕 No se pudo cargar la configuración.</p>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => dispatch(fetchNotificationSettings())}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Notificaciones</h1>

      {/* En la web no hay notificaciones push: los avisos llegan a la campanita y a la app móvil */}
      <div className="banner">
        <p className="meta">
          ℹ️ En la web verás tus avisos en la campanita. Las notificaciones push llegan a la app de Bart
          en tu celular con estas mismas preferencias.
        </p>
      </div>

      <section className="section">
        <h2 className="section-title">Tus productos</h2>
        <div className="card settings-group">
          <SwitchRow
            title="💬 Interesados y ofertas"
            subtitle="Cuando alguien te contacta por WhatsApp o te hace una oferta por tu producto"
            value={settings.requests ?? true}
            onChange={value => save({ requests: value })}
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Productos cerca de ti</h2>
        <div className="card settings-group">
          <SwitchRow
            title="📍 Productos nuevos cerca"
            subtitle="Cuando alguien publica algo cerca de tu ubicación"
            value={settings.nearbyProducts}
            onChange={toggleNearby}
          />

          {settings.nearbyProducts && (
            <>
              <SwitchRow
                title="🎁 Solo productos gratis"
                subtitle="Avisarme solo cuando regalen algo"
                value={settings.nearbyOnlyFree}
                onChange={value => save({ nearbyOnlyFree: value })}
              />

              <div className="settings-radius">
                <span className="label">Distancia máxima</span>
                <div className="chips">
                  {RADIUS_OPTIONS.map(km => (
                    <Chip
                      key={km}
                      label={`${km} km`}
                      selected={settings.nearbyRadiusKm === km}
                      onPress={() => save({ nearbyRadiusKm: km })}
                    />
                  ))}
                </div>

                <p className="hint" style={{ marginTop: 12 }}>
                  Usamos tu ubicación aproximada (~1 km). Nunca se muestra a otros usuarios.
                </p>
                <button type="button" className="btn btn--secondary btn--sm" style={{ marginTop: 10 }} onClick={shareLocation}>
                  📍 Actualizar mi ubicación
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default NotificationSettingsScreen;
