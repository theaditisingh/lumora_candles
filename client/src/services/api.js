import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    err.userMessage = err.response?.data?.message || (err.request ? 'Cannot reach the store right now. Check your connection and try again.' : 'Something went wrong. Please try again.');
    return Promise.reject(err);
  }
);

export default api;
