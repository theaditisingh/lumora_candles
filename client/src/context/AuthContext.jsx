import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('lumora_token')) { setLoading(false); return; }
    api.get('/auth/me').then((r) => setUser(r.data.data.user))
      .catch(() => localStorage.removeItem('lumora_token'))
      .finally(() => setLoading(false));
  }, []);

  const finish = (res) => {
    localStorage.setItem('lumora_token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };
  const login = useCallback((email, password) => api.post('/auth/login', { email, password }).then(finish), []);
  const register = useCallback((payload) => api.post('/auth/register', payload).then(finish), []);
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* token is dropped locally anyway */ }
    localStorage.removeItem('lumora_token');
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout, isAdmin: user?.role === 'ADMIN' }}>{children}</Ctx.Provider>;
}
