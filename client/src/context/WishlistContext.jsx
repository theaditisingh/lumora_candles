import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const Ctx = createContext(null);
export const useWishlist = () => useContext(Ctx);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!user) { setIds([]); return; }
    api.get('/wishlist').then((r) => setIds(r.data.data.productIds)).catch(() => {});
  }, [user]);

  const has = (id) => ids.includes(id);
  const toggle = async (p) => {
    if (!user) { toast('Log in to save your favourites', 'error'); nav('/login', { state: { from: pathname } }); return; }
    try {
      const r = has(p.id) ? await api.delete(`/wishlist/${p.id}`) : await api.post('/wishlist', { productId: p.id });
      setIds(r.data.data.productIds);
      toast(has(p.id) ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (e) { toast(e.userMessage, 'error'); }
  };
  return <Ctx.Provider value={{ ids, has, toggle }}>{children}</Ctx.Provider>;
}
