import { useEffect } from 'react';

export default function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Lumora Candles` : 'Lumora Candles | Handcrafted scented candles';
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
