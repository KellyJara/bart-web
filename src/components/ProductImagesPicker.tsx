import { useEffect, useRef, useState } from 'react';
import { getUploadErrorMessage, uploadImage } from '../utils/uploadImage';
import { showAlert } from '../utils/dialog';
import { Spinner } from './ui';
import '../styles/products.css';

export const MAX_PRODUCT_IMAGES = 4;

type Props = {
  value: string[]; // URLs ya subidas; la primera es la portada
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void; // para no guardar mientras sube
};

type PendingUpload = { key: string; localUri: string };

/**
 * Selector de hasta 4 fotos del producto.
 * Sube cada foto al elegirla (con revisión de contenido) y permite
 * quitarlas o elegir cuál es la portada.
 */
const ProductImagesPicker = ({ value, onChange, onUploadingChange }: Props) => {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Las subidas terminan en momentos distintos: usar siempre la lista más reciente
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    onUploadingChange?.(pending.length > 0);
  }, [pending.length, onUploadingChange]);

  const remaining = MAX_PRODUCT_IMAGES - value.length - pending.length;

  const addPhotos = async (files: FileList | null) => {
    const chosen = Array.from(files ?? []).filter(f => f.type.startsWith('image/')).slice(0, remaining);
    if (inputRef.current) inputRef.current.value = ''; // permite volver a elegir la misma foto
    if (!chosen.length) return;

    const uploads = chosen.map((file, i) => ({
      file,
      key: `${Date.now()}-${i}`,
      localUri: URL.createObjectURL(file),
    }));
    setPending(prev => [...prev, ...uploads.map(u => ({ key: u.key, localUri: u.localUri }))]);

    let rejected = 0;
    let lastError: unknown = null;
    await Promise.all(
      uploads.map(async ({ file, key, localUri }) => {
        try {
          const url = await uploadImage(file);
          if (valueRef.current.length < MAX_PRODUCT_IMAGES) {
            const next = [...valueRef.current, url];
            valueRef.current = next;
            onChange(next);
          }
        } catch (err) {
          rejected += 1;
          lastError = err;
        } finally {
          setPending(prev => prev.filter(p => p.key !== key));
          URL.revokeObjectURL(localUri);
        }
      })
    );

    if (rejected) {
      showAlert(
        rejected === 1 ? 'Una foto no se pudo subir' : `${rejected} fotos no se pudieron subir`,
        getUploadErrorMessage(lastError)
      );
    }
  };

  const remove = (url: string) => onChange(value.filter(u => u !== url));

  const makeCover = (url: string) => {
    if (value[0] === url) return;
    showAlert('Portada', '¿Usar esta foto como portada del producto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Usar como portada', onPress: () => onChange([url, ...value.filter(u => u !== url)]) },
    ]);
  };

  return (
    <div className="field">
      <div className="photos-header">
        <span className="label" style={{ marginBottom: 0 }}>Fotos del producto</span>
        <span className="photos-counter">
          {value.length}/{MAX_PRODUCT_IMAGES}
        </span>
      </div>
      <p className="hint" style={{ marginBottom: 8 }}>
        La primera es la portada. Toca una foto para usarla como portada.
      </p>

      <div className="photo-grid">
        {value.map((url, index) => (
          <div key={url} className="photo-tile">
            <button
              type="button"
              style={{ width: '100%', height: '100%' }}
              onClick={() => makeCover(url)}
              aria-label={index === 0 ? 'Foto de portada' : 'Usar como portada'}
            >
              <img src={url} alt={`Foto ${index + 1}`} />
            </button>
            {index === 0 && <span className="photo-tile__cover">Portada</span>}
            <button
              type="button"
              className="photo-tile__remove"
              onClick={() => remove(url)}
              aria-label="Quitar foto"
            >
              ✕
            </button>
          </div>
        ))}

        {pending.map(p => (
          <div key={p.key} className="photo-tile">
            <img src={p.localUri} alt="" />
            <div className="photo-tile__overlay">
              <Spinner small />
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            className="photo-tile photo-tile--add"
            onClick={() => inputRef.current?.click()}
            aria-label="Agregar fotos"
          >
            <span style={{ fontSize: 26 }} aria-hidden>📷</span>
            <span>Agregar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={e => addPhotos(e.target.files)}
      />
    </div>
  );
};

export default ProductImagesPicker;
