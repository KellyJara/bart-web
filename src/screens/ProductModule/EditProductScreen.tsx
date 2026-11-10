import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchProductById, updateProduct } from '../../redux/slices/product/productSlice';
import CategoryPicker from '../../components/CategoryPicker';
import LocationPicker, { PickedLocation } from '../../components/LocationPicker';
import PriceModeSelector from '../../components/PriceModeSelector';
import { getCategory } from '../../constants/categories';
import { getProductImages, updateProductPayload } from '../../redux/types/product.type';
import ProductImagesPicker from '../../components/ProductImagesPicker';
import EmptyState from '../../components/EmptyState';
import { formatPriceInput, parsePrice } from '../../utils/currency';
import { showAlert } from '../../utils/dialog';
import { getPriceMode, PriceMode } from '../../utils/productPrice';
import { BackButton, PageLoader, Spinner, SwitchRow } from '../../components/ui';
import '../../styles/products.css';

const DESCRIPTION_MAX = 500;

const EditProductScreen = () => {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selectedProduct, loading, error } = useAppSelector(state => state.products);

  const [form, setForm] = useState<updateProductPayload>({
    name: '',
    category: '',
    price: 0,
    imgURL: '',
    description: '',
    stock: 0,
    isActive: true,
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ubicación: la guardada solo trae "Barrio, Ciudad". Si la cambia, se envían las nuevas coordenadas.
  const [location, setLocation] = useState<PickedLocation | null>(null);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct && selectedProduct._id === id) {
      setLocation(
        selectedProduct.locationLabel
          ? { label: selectedProduct.locationLabel, source: 'saved' }
          : null
      );
      setForm({
        name: selectedProduct.name,
        category: selectedProduct.category,
        price: selectedProduct.price,
        priceOpen: !!selectedProduct.priceOpen,
        imgURL: selectedProduct.imgURL,
        images: getProductImages(selectedProduct), // productos antiguos: solo la portada
        description: selectedProduct.description,
        stock: selectedProduct.stock,
        isActive: selectedProduct.isActive,
        acceptsOffers: selectedProduct.acceptsOffers ?? false,
      });
    }
  }, [selectedProduct, id]);

  const handleChange = (key: keyof updateProductPayload, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Tipo de precio (se deduce del formulario: 0 = regalo, priceOpen = sin precio)
  const priceMode: PriceMode = getPriceMode(form);
  const setPriceMode = (mode: PriceMode) =>
    setForm(prev => ({
      ...prev,
      priceOpen: mode === 'offers',
      // Regalo: precio 0. Con precio: se escribe (vacío hasta entonces). Sin precio: null.
      price: mode === 'gift' ? 0 : mode === 'offers' ? null : prev.price && prev.price > 0 ? prev.price : null,
    }));

  // Fotos: la portada (imgURL) siempre es la primera
  const setImages = (images: string[]) =>
    setForm(prev => ({ ...prev, images, imgURL: images[0] ?? '' }));

  // Campos obligatorios que faltan (los productos antiguos pueden tener la categoría escrita a mano)
  const missingFields = [
    !form.name?.trim() && 'nombre',
    !getCategory(form.category) && 'categoría',
    priceMode === 'fixed' && !(Number(form.price) > 0) && 'precio',
    !form.images?.length && 'al menos una foto',
    !location && 'ubicación',
  ].filter(Boolean) as string[];
  const canSubmit = missingFields.length === 0 && !uploadingImages && !saving;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      // La ubicación solo se envía si el usuario eligió una nueva (la guardada no trae coordenadas)
      const newLocation =
        location && location.source !== 'saved' && location.latitude !== undefined && location.longitude !== undefined
          ? {
              location: { latitude: location.latitude, longitude: location.longitude },
              locationLabel: location.label,
            }
          : {};
      const product: updateProductPayload = {
        ...form,
        name: form.name?.trim(),
        // Sin precio siempre recibe ofertas; regalo nunca
        acceptsOffers: priceMode === 'offers' || (priceMode === 'fixed' && !!form.acceptsOffers),
        ...newLocation,
      };
      await dispatch(updateProduct({ id, product })).unwrap();
      showAlert('Éxito', 'Producto actualizado correctamente');
      navigate('/my-products');
    } catch (err) {
      showAlert('Error', typeof err === 'string' ? err : 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error && !selectedProduct) {
    return <EmptyState emoji="⚠️" title="No se pudo cargar el producto" message={error} />;
  }
  if (!selectedProduct) return <EmptyState emoji="🔍" title="Producto no encontrado" />;

  const hasLegacyCategory = !!form.category && !getCategory(form.category);
  const footerHint =
    missingFields.length > 0
      ? `Para guardar falta: ${missingFields.join(', ')}`
      : uploadingImages
        ? 'Espera a que terminen de subir las fotos...'
        : null;

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Editar producto</h1>

      <form onSubmit={handleSubmit}>
        {/* ---------- FOTOS ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Fotos</h2>
          <div className="form-card">
            <ProductImagesPicker value={form.images ?? []} onChange={setImages} onUploadingChange={setUploadingImages} />
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
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="field">
              <span className="label">Categoría</span>
              <CategoryPicker value={form.category} onChange={key => handleChange('category', key)} />
              {hasLegacyCategory && (
                <p className="notice notice--warning">
                  ⚠️ Antes era "{form.category}". Elige una categoría de la lista.
                </p>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="description">Descripción</label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Estado, medidas, detalles importantes..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                maxLength={DESCRIPTION_MAX}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="stock">Unidades disponibles</label>
              <input
                id="stock"
                className="input"
                type="number"
                min={0}
                value={form.stock?.toString()}
                onChange={e => handleChange('stock', Number(e.target.value))}
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

            {priceMode === 'offers' && (
              <p className="notice notice--info">
                <span aria-hidden>💡</span>
                <span>
                  ¿No sabes cuánto pedir? Publícalo sin precio: los compradores te escribirán por WhatsApp
                  diciendo cuánto ofrecen y tú decides.
                </span>
              </p>
            )}
            {priceMode === 'gift' && (
              <p className="notice notice--success">
                <span aria-hidden>🎁</span>
                <span>Lo publicas gratis. Las personas interesadas te escribirán por WhatsApp.</span>
              </p>
            )}
            {priceMode === 'fixed' && (
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label" htmlFor="price">Precio (COP)</label>
                <div className="price-input">
                  <span className="price-input__prefix" aria-hidden>$</span>
                  <input
                    id="price"
                    className="input"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.price ? formatPriceInput(String(form.price)) : ''}
                    // Vacío = sin escribir (null). Nunca 0: 0 significa regalo
                    onChange={e => setForm(prev => ({ ...prev, price: parsePrice(e.target.value) || null }))}
                  />
                </div>
                {!form.price && <p className="error-text" style={{ marginTop: 4 }}>Escribe el precio</p>}
              </div>
            )}
            {priceMode === 'fixed' && Number(form.price) > 0 && (
              <SwitchRow
                title="💰 Acepto ofertas"
                subtitle="Los compradores podrán proponerte otro precio y tú decides si aceptas."
                value={form.acceptsOffers ?? false}
                onChange={value => handleChange('acceptsOffers', value)}
              />
            )}
          </div>
        </section>

        {/* ---------- UBICACIÓN ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Ubicación del producto</h2>
          <div className="form-card">
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        </section>

        {/* ---------- VISIBILIDAD ---------- */}
        <section className="form-section">
          <h2 className="form-section__title">Visibilidad</h2>
          <div className="form-card">
            <SwitchRow
              title="👁️ Activo"
              subtitle="Desactívalo para pausar la publicación."
              value={form.isActive ?? true}
              onChange={value => handleChange('isActive', value)}
            />
          </div>
        </section>

        {/* ---------- GUARDAR (fijo abajo) ---------- */}
        <div className="form-footer">
          {!!footerHint && <p className="form-footer__hint">{footerHint}</p>}
          <button type="submit" className="btn btn--block" disabled={!canSubmit}>
            {saving ? <Spinner small /> : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductScreen;
