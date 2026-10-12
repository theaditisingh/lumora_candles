import { API_ORIGIN } from '../services/api';

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
// Uploaded images come from the API; seeded "/images/..." paths use the generated candle illustration instead
export const imageUrl = (path) => (path && path.startsWith('/uploads') ? `${API_ORIGIN}${path}` : null);
