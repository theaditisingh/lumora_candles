import { Link } from 'react-router-dom';
import { Newsletter } from '../pages/InfoPages';

const cols = [
  ['Shop', [['All candles', '/shop'], ['Gift sets', '/shop?category=gift-sets'], ['Soy candles', '/shop?category=soy-candles'], ['Festive collection', '/shop?category=festive-collection']]],
  ['Help', [['Contact us', '/contact'], ['FAQ', '/faq'], ['Track an order', '/account/orders'], ['Shipping policy', '/shipping-policy']]],
  ['Company', [['About Lumora', '/about'], ['Privacy policy', '/privacy-policy'], ['Terms & conditions', '/terms'], ['Refund & cancellation', '/refund-policy']]],
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-smoke text-paper/80">
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl text-paper">Lumora<span className="text-wax"> Candles</span></p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">Small-batch candles poured by hand, made to make every room feel warmer and calmer.</p>
          <Newsletter />
        </div>
        {cols.map(([title, items]) => (
          <div key={title}>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-wax">{title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">{items.map(([l, to]) => <li key={l}><Link to={to} className="transition-colors hover:text-wax">{l}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10 py-6 text-center text-xs text-paper/50">© {new Date().getFullYear()} Lumora Candles. Never leave a burning candle unattended.</div>
    </footer>
  );
}
