import { createContext, useCallback, useContext, useState } from 'react';
import { X } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${t.type === 'error' ? 'bg-red-800 text-white' : 'bg-smoke text-paper'}`}>
            <span>{t.message}</span>
            <button aria-label="Dismiss" onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))}><X size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
