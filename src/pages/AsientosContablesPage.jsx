import React from 'react';
import axios from 'axios';
import {
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ENV, { ENDPOINTS } from '../config/environment';
import { getAuthHeaders } from '../api/authHeaders';

const accountingApi = axios.create({
  baseURL: ENV.ACCOUNTING_API_BASE_URL,
  timeout: 15000,
});

const fmt = (n) => Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2 });
const shortUuid = (uuid) => (uuid ? `${uuid.slice(0, 8)}…` : '—');

const entryReferences = (entry) => {
  const refs = (entry.lines || [])
    .map((line) => line.reference)
    .filter((ref) => ref && ref.trim().length > 0);
  return [...new Set(refs)];
};

const STATUS_STYLES = {
  REGISTRADO: 'bg-green-50 text-green-700 border-green-200',
  ANULADO: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function AsientosContablesPage() {
  const [entries, setEntries] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [expandedUuid, setExpandedUuid] = React.useState(null);
  const [contableDate, setContableDate] = React.useState(null);

  const [filters, setFilters] = React.useState({ from: '', to: '', status: '' });

  React.useEffect(() => {
    let cancelled = false;
    accountingApi
      .get(ENDPOINTS.ACCOUNTING.CONTABLE_DATE, { headers: getAuthHeaders() })
      .then((res) => {
        if (!cancelled) setContableDate(res.data?.contableDate ?? null);
      })
      .catch(() => {
        // No bloquea la página: si el dato no está disponible, simplemente no se muestra el badge.
        if (!cancelled) setContableDate(null);
      });
    return () => { cancelled = true; };
  }, []);

  const fetchEntries = React.useCallback(async (pageToLoad, activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageToLoad, size: 15 };
      if (activeFilters.from) params.from = activeFilters.from;
      if (activeFilters.to) params.to = activeFilters.to;
      if (activeFilters.status) params.status = activeFilters.status;

      const res = await accountingApi.get(ENDPOINTS.ACCOUNTING.ENTRIES, { params, headers: getAuthHeaders() });
      setEntries(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      setError(
        e.response
          ? e.response.data?.message || e.response.data?.detail || 'Error al consultar los asientos.'
          : 'No se puede conectar al accounting-service (puerto 8082).'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchEntries(page, filters); }, [fetchEntries, page, filters]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchEntries(0, filters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Asientos Contables</h1>
          <p className="text-slate-500 mt-1">
            Consulta los asientos registrados y verifica su cuadre y trazabilidad.
          </p>
        </div>
        {contableDate && (
          <span
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl px-4 py-2 text-sm font-semibold"
            title="Avanza únicamente con el cierre End-of-Day (EOD), no con la hora del sistema."
          >
            Fecha contable activa: {new Date(`${contableDate}T00:00:00`).toLocaleDateString('es-EC')}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="REGISTRADO">Registrado</option>
            <option value="ANULADO">Anulado (reversado)</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => fetchEntries(page, filters)}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-semibold disabled:opacity-50 ml-auto"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen size={22} className="text-blue-800" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Asientos registrados</h2>
        </div>

        {loading && <div className="p-8 text-center text-slate-400 text-sm">Cargando asientos...</div>}

        {!loading && entries.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">No hay asientos que coincidan con el filtro.</div>
        )}

        {!loading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Asiento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Operación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Debe</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Haber</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cuadre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trazabilidad</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const isExpanded = expandedUuid === entry.entryUuid;
                  return (
                    <React.Fragment key={entry.entryUuid}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(entry.entryDate).toLocaleString('es-EC')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600" title={entry.entryUuid}>
                          {shortUuid(entry.entryUuid)}
                        </td>
                        <td className="px-4 py-3 text-slate-800">{entry.description}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[entry.status] || ''}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">${fmt(entry.totalDebit)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">${fmt(entry.totalCredit)}</td>
                        <td className="px-4 py-3 text-center">
                          {entry.balanced
                            ? <CheckCircle2 size={18} className="text-green-600 inline" />
                            : <XCircle size={18} className="text-red-600 inline" />}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {(() => {
                            const refs = entryReferences(entry);
                            const hasReversalInfo = entry.reversalOfEntryUuid || entry.reversedByEntryUuid;
                            if (refs.length === 0 && !hasReversalInfo) return '—';
                            return (
                              <div className="flex flex-col gap-0.5">
                                {refs.length > 0 && (
                                  <span className="font-mono text-slate-600" title={refs.join(', ')}>
                                    {refs.join(', ')}
                                  </span>
                                )}
                                {entry.reversalOfEntryUuid && <span>Reverso de {shortUuid(entry.reversalOfEntryUuid)}</span>}
                                {entry.reversedByEntryUuid && <span>Reversado por {shortUuid(entry.reversedByEntryUuid)}</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedUuid(isExpanded ? null : entry.entryUuid)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold text-xs"
                          >
                            Ver {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="space-y-3">
                              <table className="w-full text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Cuenta</th>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Movimiento</th>
                                    <th className="text-right px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Referencia</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {entry.lines.map((line, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 font-mono">{line.accountCode}</td>
                                      <td className="px-3 py-2">{line.accountName}</td>
                                      <td className="px-3 py-2">{line.movementType}</td>
                                      <td className="px-3 py-2 text-right font-mono">${fmt(line.amount)}</td>
                                      <td className="px-3 py-2 text-slate-500">{line.reference || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">UUID completo: {entry.entryUuid}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-slate-500">Página {page + 1} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-40"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AsientosContablesPage;
