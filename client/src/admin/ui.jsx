import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export function useLoad(url) {
  const [s, setS] = useState({ body: null, error: '', loading: true });
  const load = useCallback(() => {
    setS((x) => ({ ...x, loading: true, error: '' }));
    return api.get(url).then((r) => setS({ body: r.data, error: '', loading: false })).catch((e) => setS({ body: null, error: e.userMessage, loading: false }));
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { ...s, data: s.body?.data, meta: s.body?.meta, reload: load };
}

export const Head = ({ title, children }) => <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl sm:text-3xl">{title}</h1><div className="flex flex-wrap gap-2">{children}</div></div>;
export const Card = ({ title, children, className = '' }) => <section className={`card ${className}`}>{title && <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-stone">{title}</h2>}{children}</section>;
export const Err = ({ children, retry }) => <div className="card border-red-200 bg-red-50 text-sm text-red-800">{children}{retry && <button className="ml-3 font-semibold underline" onClick={retry}>Retry</button>}</div>;
export const Loading = () => <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-fig" /><p className="mt-3 text-sm text-stone">Loading…</p></div>;

export function Table({ head, children, empty = 'Nothing here yet.' }) {
  const rows = Array.isArray(children) ? children.flat().filter(Boolean) : children;
  return (
    <div className="overflow-x-auto card p-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-sand/50 bg-oat/30"><tr>{head.map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-sand/40">{rows && rows.length !== 0 ? rows : <tr><td colSpan={head.length} className="px-4 py-12 text-center text-stone">{empty}</td></tr>}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className = '' }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;

export const Pager = ({ meta, onPage }) => meta && meta.totalPages > 1 && (
  <div className="mt-4 flex items-center justify-center gap-3 text-sm">
    <button className="btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
    <span className="text-stone">Page {meta.page} of {meta.totalPages}</span>
    <button className="btn-ghost btn-sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</button>
  </div>
);

export const Field = ({ label, children, hint }) => <label className="block text-sm font-medium">{label}<div className="mt-1.5">{children}</div>{hint && <p className="mt-1 text-xs font-normal text-stone">{hint}</p>}</label>;
export const Status = ({ s }) => <span className={`badge ${['CANCELLED', 'REFUNDED', 'OUT'].includes(s) ? 'bg-red-100 text-red-800' : ['DELIVERED', 'OK'].includes(s) ? 'bg-green-100 text-green-800' : s === 'LOW' ? 'bg-amber-100 text-amber-800' : 'bg-sand/70 text-smoke'}`}>{String(s).replace(/_/g, ' ')}</span>;
export const useDebounced = (v, ms = 350) => { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; };
