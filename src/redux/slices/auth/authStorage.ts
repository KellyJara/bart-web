// En la web la sesión se guarda en localStorage (en la app móvil es AsyncStorage).
// El acceso puede fallar en modo privado o con el almacenamiento bloqueado.
const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    console.log(`Error guardando ${key}:`, error);
  }
};

export const saveToken = (token: string) => write('token', token);
export const getToken = () => read('token');
export const removeToken = () => write('token', null);

/* ---------- USER ID ---------- */
export const saveUserId = (userId: string) => write('userId', userId);
export const getUserId = () => read('userId');
export const removeUserId = () => write('userId', null);

/* ---------- Otros valores (consentimiento de ubicación, etc.) ---------- */
export const storage = { read, write };
