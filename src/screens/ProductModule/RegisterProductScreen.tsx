import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImagesPicker from '../../components/ProductImagesPicker';
import { useAppDispatch } from '../../redux/hooks';
import { createProduct } from '../../redux/slices/product/productSlice';
import CategoryPicker from '../../components/CategoryPicker';
import LocationPicker, { PickedLocation } from '../../components/LocationPicker';
import PriceModeSelector from '../../components/PriceModeSelector';
import { CreateProductPayload } from '../../redux/types/product.type';
import { formatPriceInput, parsePrice } from '../../utils/currency';
import { showAlert } from '../../utils/dialog';
import { PriceMode } from '../../utils/productPrice';
import { BackButton, Spinner, SwitchRow } from '../../components/ui';
import '../../styles/products.css';

const DESCRIPTION_MAX = 500;

const RegisterProductScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState<string[]>([]); // hasta 4, la primera es la portada
  const [uploadingImages, setUploadingImages] = useState(false);
  // Tipo de precio: con precio fijo, sin precio (recibe ofertas) o regalo
  const [priceMode, setPriceMode] = useState<PriceMode>('fixed');
  const isGift = priceMode === 'gift';
  const isOpenPrice = priceMode === 'offers';
  const [acceptsOffers, setAcceptsOffers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ubicación del producto (obligatoria): por defecto la actual; el usuario puede buscar otra.
  // Se guarda aproximada (~1 km) y los compradores solo ven "Barrio, Ciudad".
  const [location, setLocation] = useState<PickedLocation | null>(null);

  // Campos obligatorios que faltan. Un producto en venta necesita precio mayor a 0
  // (precio 0 = regalo). Descripción y stock son opcionales.
  const missingFields = [
    !name.trim() && 'nombre',
    !category && 'categoría',
    // Solo con precio fijo hace falta escribirlo
    priceMode === 'fixed' && !(parsePrice(price) > 0) && 'precio',
    images.length === 0 && 'al menos una foto',
    location?.latitude === undefined && 'ubicación',
  ].filter(Boolean) as string[];
  // El botón solo se activa con todo lo obligatorio y las fotos ya subidas
  const canSubmit = missingFields.length === 0 && !uploadingImages && !saving;

  const registerProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: CreateProductPayload = {
      name: name.trim(),
      category,
      price: isGift ? 0 : isOpenPrice ? null : parsePrice(price),
      priceOpen: isOpenPrice,
      imgURL: images[0], // portada
      images,
      description,
      stock: Number(stock) || 0,
      isActive: true,
      inCart: false,
      location:
        location?.latitude !== undefined && location.longitude !== undefined
          ? { latitude: location.latitude, longitude: location.longitude }
          : undefined,
      locationLabel: location?.label ?? '',
      // Sin precio siempre recibe ofertas; con precio, si el vendedor lo activa
      acceptsOffers: isOpenPrice || (priceMode === 'fixed' && acceptsOffers),
    };

    setSaving(true);
    try {
      const product = await dispatch(createProduct(payload)).unwrap();
      showAlert('Éxito', 'Producto registrado');
      navigate(`/product/${product._id}`, { replace: true });
    } catch (error: any) {
      showAlert('Error', typeof error === 'string' ? error : 'No se pudo registrar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Qué falta para poder registrar
  const footerHint =
    missingFields.length > 0
      ? `Para registrar falta: ${missingFields.join(', ')}`
      : uploadingImages
        ? 'Espera a que terminen de subir las fotos...'
        : null;

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Publicar producto</h1>

      <form onSubmit={registerProduct}>
        {/* ---------- FOTOS ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Fotos</h2>
          <div className="form-card">
            <ProductImagesPicker value={images} onChange={setImages} onUploadingChange={setUploadingImages} />
          </div>
        </section>

        {/* ---------- INFORMACIÓN ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Información</h2>
          <div className="form-card">
            <div className="field">
              <label className="label" htmlFor="name">Nombre</label>
              <input
                id="name"
                className="input"
                placeholder="Ej.: Bicicleta de montaña rin 26"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="field">
              <span className="label">Categoría</span>
              <CategoryPicker value={category} onChange={setCategory} />
            </div>

            <div className="field">
              <label className="label" htmlFor="description">Descripción (opcional)</label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Estado, medidas, detalles importantes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={DESCRIPTION_MAX}
              />
              <span className="hint char-counter">{description.length}/{DESCRIPTION_MAX}</span>
            </div>

            <div className="field">
              <label className="label" htmlFor="stock">Unidades disponibles (opcional)</label>
              <input
                id="stock"
                className="input"
                type="number"
                min={0}
                placeholder="Ej.: 1"
                value={stock}
                onChange={e => setStock(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ---------- PRECIO ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Precio</h2>
          <div className="form-card">
            {/* ¿Cómo lo publicas? */}
            <PriceModeSelector value={priceMode} onChange={setPriceMode} />

            {isOpenPrice ? (
              <p className="notice notice--info">
                <span aria-hidden>💡</span>
                <span>
                  ¿No sabes cuánto pedir? Publícalo sin precio: los compradores te escribirán por WhatsApp
                  diciendo cuánto ofrecen y tú decides.
                </span>
              </p>
            ) : isGift ? (
              <p className="notice notice--success">
                <span aria-hidden>🙋</span>
                <span>
                  Las personas interesadas te escribirán por WhatsApp y tú eliges a quién regalarlo según su perfil.
                </span>
              </p>
            ) : (
              <>
                <div className="field" style={{ marginTop: 14 }}>
                  <label className="label" htmlFor="price">Precio (COP)</label>
                  <div className="price-input">
                    <span className="price-input__prefix" aria-hidden>$</span>
                    <input
                      id="price"
                      className="input"
                      inputMode="numeric"
                      placeholder="0"
                      value={price}
                      onChange={e => setPrice(formatPriceInput(e.target.value))}
                    />
                  </div>
                </div>
                <SwitchRow
                  title="💰 Acepto ofertas"
                  subtitle="Los compradores podrán proponerte otro precio y tú decides si aceptas."
                  value={acceptsOffers}
                  onChange={setAcceptsOffers}
                />
              </>
            )}
          </div>
        </section>

        {/* ---------- UBICACIÓN (obligatoria) ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Ubicación del producto</h2>
          <div className="form-card">
            <LocationPicker value={location} onChange={setLocation} autoDetect />
          </div>
        </section>

        {/* ---------- PUBLICAR (fijo abajo) ---------- */}
        <div className="form-footer">
          {!!footerHint && <p className="form-footer__hint">{footerHint}</p>}
          {/* Desactivado hasta llenar lo obligatorio */}
          <button type="submit" className="btn btn--block" disabled={!canSubmit}>
            {saving ? <Spinner small /> : 'Publicar producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterProductScreen;
