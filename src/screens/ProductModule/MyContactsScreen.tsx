import MyContactsList from '../../components/MyContactsList';

/**
 * Postulaciones: productos por los que escribí al vendedor por WhatsApp
 * o le hice una oferta (cuánto ofrecí), con el estado de cada uno.
 */
const MyContactsScreen = () => (
  <div className="page">
    <h1 className="page-title">Postulaciones</h1>
    <p className="meta" style={{ marginBottom: 12 }}>
      A quién le escribiste por WhatsApp y cuánto ofreciste.
    </p>
    <MyContactsList />
  </div>
);

export default MyContactsScreen;
