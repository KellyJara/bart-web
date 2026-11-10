// "ahora", "hace 5 min", "hace 2 h", "ayer", "12 oct"
export const timeAgo = (date: string | Date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ayer';
  return new Date(date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

export const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
