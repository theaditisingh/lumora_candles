import { imageUrl } from '../utils/format';

const TONES = {
  Vanilla: ['#EADBB8', '#C9A66B'], Lavender: ['#CFC3DD', '#8C7AA6'], Rose: ['#E8C4C4', '#B66A7A'], Sandalwood: ['#D8BC9A', '#9A6B43'],
  Citrus: ['#F2D59B', '#D98E2B'], Oud: ['#8F7A74', '#3E2F2C'], Jasmine: ['#F1E8D2', '#CDB77C'], Coffee: ['#B79A82', '#5E4333'],
  Ocean: ['#BFD6DB', '#5F8C99'], Cinnamon: ['#D3A27E', '#8E4F2E'], Spice: ['#C98B7A', '#7B3B33'], Eucalyptus: ['#C5D3C2', '#6C8A71'],
};

// Generated candle illustration used until real product photos are uploaded from the admin panel
export function CandleArt({ fragrance = '', name = '' }) {
  const [wax, deep] = TONES[fragrance] || ['#E5D8C4', '#A38A66'];
  const id = name.replace(/\W/g, '').slice(0, 12) || 'c';
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${name} candle`}>
      <defs><linearGradient id={`g${id}`} x1="0" x2="1"><stop offset="0" stopColor={wax} /><stop offset="1" stopColor={deep} stopOpacity=".55" /></linearGradient></defs>
      <rect width="200" height="200" fill="#F1ECE3" />
      <ellipse cx="100" cy="168" rx="52" ry="9" fill="#26211F" opacity=".12" />
      <rect x="55" y="86" width="90" height="82" rx="10" fill={`url(#g${id})`} />
      <rect x="55" y="86" width="90" height="10" rx="5" fill="#fff" opacity=".35" />
      <rect x="68" y="118" width="64" height="26" rx="3" fill="#FAF8F4" opacity=".75" />
      <rect x="98.5" y="64" width="3" height="24" rx="1.5" fill="#3b2f2a" />
      <path className="flame" d="M100 30c10 14 14 22 14 31a14 14 0 0 1-28 0c0-9 4-17 14-31z" fill="#C8963E" />
      <path className="flame" d="M100 46c5 7 7 11 7 15a7 7 0 0 1-14 0c0-4 2-8 7-15z" fill="#FFF3C9" />
    </svg>
  );
}

export default function ProductImage({ product, image, className = '' }) {
  const src = imageUrl((image || product.images?.[0])?.url);
  return (
    <div className={`overflow-hidden bg-paper ${className}`}>
      {src ? <img src={src} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <CandleArt fragrance={product.fragrance} name={product.name} />}
    </div>
  );
}
