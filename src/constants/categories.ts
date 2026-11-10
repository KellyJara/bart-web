// Categorías de productos. Mantener sincronizado con el backend (src/libs/categories.js)
export interface Category {
  key: string;
  label: string;
  icon: string;
}

// El orden de esta lista es el que se ve en "Publicar producto" y en los filtros del inicio
export const CATEGORIES: Category[] = [
  { key: 'ropa', label: 'Ropa, calzado y accesorios', icon: '👕' },
  { key: 'hogar', label: 'Hogar y muebles', icon: '🛋️' },
  { key: 'electrodomesticos', label: 'Electrodomésticos', icon: '🧺' },
  { key: 'juguetes', label: 'Juguetes', icon: '🧸' },
  { key: 'electronica', label: 'Electrónica', icon: '🔌' },
  { key: 'libros', label: 'Libros', icon: '📚' },
  { key: 'jardin', label: 'Jardín y plantas', icon: '🌱' },
  { key: 'belleza', label: 'Belleza y salud', icon: '💄' },
  { key: 'otros', label: 'Otros', icon: '📦' },
  { key: 'mascotas', label: 'Mascotas', icon: '🐾' },
  { key: 'musica', label: 'Música', icon: '🎸' },
  { key: 'herramientas', label: 'Herramientas', icon: '🔧' },
  { key: 'deportes', label: 'Deportes', icon: '⚽' },
  { key: 'vehiculos', label: 'Vehículos y bicis', icon: '🚲' },
];

// Categorías que ya no se pueden elegir, pero que pueden tener productos publicados antes:
// se siguen mostrando con su nombre (no aparecen en "Publicar producto" ni en los filtros)
const RETIRED_CATEGORIES: Category[] = [
  { key: 'celulares', label: 'Celulares', icon: '📱' },
  { key: 'computadores', label: 'Computadores', icon: '💻' },
  { key: 'videojuegos', label: 'Videojuegos', icon: '🎮' },
  { key: 'bebes', label: 'Bebés', icon: '🍼' },
];

export const getCategory = (key?: string) => CATEGORIES.find(c => c.key === key);

// Los productos antiguos tienen la categoría escrita a mano: se muestra tal cual
export const getCategoryLabel = (key?: string) => {
  const category = getCategory(key) ?? RETIRED_CATEGORIES.find(c => c.key === key);
  return category ? `${category.icon} ${category.label}` : key ?? '';
};
