import axios from 'axios';
import { getToken } from '../slices/auth/authStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_URL_BACKEND,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
