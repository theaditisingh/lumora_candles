import { Star } from 'lucide-react';

export default function Stars({ value = 0, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}>
      <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-wax text-wax' : 'text-sand'} />)}</span>
      {count !== undefined && <span className="text-xs text-stone">({count})</span>}
    </span>
  );
}
