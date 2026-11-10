import { useState, type CSSProperties } from 'react';
import '../../styles/seller.css';

export type BarDatum = { key: string; label: string; value: number };

type Props = {
  data: BarDatum[];
  height?: number;
  color?: string;
  /** Texto del valor de la barra elegida: "3 publicados" */
  formatValue?: (value: number) => string;
};

// Máximo "redondo" del eje: 1, 2, 5, 10, 20, 50…
const niceMax = (max: number) => {
  if (max <= 1) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const step = [1, 2, 5, 10].find(s => s * pow >= max) ?? 10;
  return step * pow;
};

/**
 * Barras de una sola serie (sin leyenda: el título de la tarjeta dice qué es).
 * Barras delgadas con punta redondeada sobre la línea base, cuadrícula discreta
 * y el valor del día al pasar el mouse o tocar una barra (por defecto se muestra el último día).
 */
const BarChart = ({ data, height = 140, color, formatValue = v => String(v) }: Props) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceMax(Math.max(0, ...data.map(d => d.value)));
  const active = hovered ?? selected ?? data.length - 1;
  const highlight = hovered !== null || selected !== null;
  const current = data[active];

  // Etiquetas del eje X: primera, del medio y última (no en cada barra)
  const labelIdx =
    data.length <= 7 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  // Posición de la etiqueta (en %), alineada en los extremos para que no se salga
  const labelStyle = (i: number): CSSProperties => {
    const center = ((i + 0.5) / data.length) * 100;
    if (i === 0 && data.length > 1) return { left: 0 };
    if (i === data.length - 1 && data.length > 1) return { right: 0 };
    return { left: `${center}%`, transform: 'translateX(-50%)' };
  };

  return (
    <div>
      {/* Valor de la barra elegida */}
      {current && (
        <p className="sl-chart__readout" aria-live="polite">
          <span className="sl-chart__value">{formatValue(current.value)}</span>
          <span className="sl-chart__label">{`  ·  ${current.label}`}</span>
        </p>
      )}

      <div className="sl-chart__plot">
        {/* Eje Y: solo el máximo y el 0 */}
        <div className="sl-chart__y" style={{ height }}>
          <span className="sl-chart__axis-text">{max}</span>
          <span className="sl-chart__axis-text">0</span>
        </div>

        <div className="sl-chart__area">
          <div className="sl-chart__bars" style={{ height }} onMouseLeave={() => setHovered(null)}>
            {/* Cuadrícula discreta: línea del máximo y la mitad */}
            <div className="sl-chart__grid" style={{ top: 0 }} />
            <div className="sl-chart__grid" style={{ top: height / 2 }} />

            {data.map((d, i) => {
              const barHeight = d.value > 0 ? Math.max((d.value / max) * height, 3) : 0;
              const isActive = i === active;
              return (
                <button
                  key={d.key}
                  type="button"
                  className="sl-chart__slot"
                  onClick={() => setSelected(i)}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${d.label}: ${formatValue(d.value)}`}
                  aria-pressed={selected === i}
                >
                  <span
                    className="sl-chart__bar"
                    style={{
                      height: barHeight,
                      background: color,
                      opacity: !highlight || isActive ? 1 : 0.45,
                    }}
                  />
                  {isActive && <span className="sl-chart__marker" style={{ height }} />}
                </button>
              );
            })}
          </div>
          <div className="sl-chart__baseline" />

          {/* Eje X */}
          <div className="sl-chart__x">
            {labelIdx.map(i => (
              <span key={data[i].key} className="sl-chart__axis-text" style={labelStyle(i)}>
                {data[i].label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
