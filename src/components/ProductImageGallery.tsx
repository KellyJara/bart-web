import { useRef, useState } from 'react';
import '../styles/products.css';

type Props = {
  images: string[];
};

/**
 * Galería del detalle del producto: se desliza de lado (o con flechas)
 * y muestra el número y puntos para saber en qué foto vas.
 */
const ProductImageGallery = ({ images }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="gallery gallery--limited">
      <div className="gallery__track" ref={trackRef} onScroll={onScroll}>
        {images.map((uri, i) => (
          <img key={`${i}-${uri}`} src={uri} alt={`Foto ${i + 1}`} className="gallery__img" />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <span className="gallery__counter" aria-live="polite">
            {index + 1}/{images.length}
          </span>
          {index > 0 && (
            <button type="button" className="gallery__arrow gallery__arrow--prev hide-mobile" onClick={() => goTo(index - 1)} aria-label="Foto anterior">
              ‹
            </button>
          )}
          {index < images.length - 1 && (
            <button type="button" className="gallery__arrow gallery__arrow--next hide-mobile" onClick={() => goTo(index + 1)} aria-label="Foto siguiente">
              ›
            </button>
          )}
          <div className="gallery__dots">
            {images.map((uri, i) => (
              <button
                key={`${i}-${uri}`}
                type="button"
                className={`gallery__dot${i === index ? ' active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductImageGallery;
