// Moneda de la app: pesos colombianos (COP), sin decimales y con punto de miles.
// Ej.: 25000 -> "$25.000"

const withThousands = (n: number) =>
  Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const formatPrice = (value?: number | string | null) => {
  const n = Number(value) || 0;
  return `${n < 0 ? '-' : ''}$${withThousands(n)}`;
};

// Texto del input -> número (ignora puntos, comas, "$" y espacios). '' -> NaN
export const parsePrice = (text: string) => {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : NaN;
};

// Muestra el número con puntos de miles mientras el usuario escribe ("25000" -> "25.000")
export const formatPriceInput = (text: string) => {
  const n = parsePrice(text);
  return Number.isNaN(n) ? '' : withThousands(n);
};
