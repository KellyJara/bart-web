// Texto del contador de favoritos: "❤️ 1 persona lo tiene en favoritos"
export const formatFavoritesCount = (count?: number, { short = false } = {}) => {
  const n = count ?? 0;
  if (short) return `❤️ ${n}`;
  if (n === 0) return 'Nadie lo tiene en favoritos todavía';
  return `❤️ ${n} ${n === 1 ? 'persona lo tiene' : 'personas lo tienen'} en favoritos`;
};
