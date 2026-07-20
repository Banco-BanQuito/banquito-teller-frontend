import React from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  FileText,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import ENV from '../config/environment';

const accountingApi = axios.create({
  baseURL: ENV.ACCOUNTING_API_BASE_URL,
  timeout: 15000,
  headers: {
    ...(ENV.APIGEE_API_KEY ? { 'x-api-key': ENV.APIGEE_API_KEY, apikey: ENV.APIGEE_API_KEY } : {})
  },
});

const fmt = (n) => Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2 });

export function EndOfDayPage() {
  const [balance, setBalance] = React.useState(null);
  const [loadingBalance, setLoadingBalance] = React.useState(false);
  const [runningEod, setRunningEod] = React.useState(false);
  const [eodResult, setEodResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const fetchBalance = React.useCallback(async () => {
    setLoadingBalance(true);
    setError('');
    setEodResult(null);
    try {
      const res = await accountingApi.get('/accounting/trial-balance');
      setBalance(res.data);
    } catch (e) {
      setError(
        e.response
          ? e.response.data?.message || 'Error al consultar el balance.'
          : 'No se puede conectar al accounting-service (puerto 8082).'
      );
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  React.useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleRunEod = async () => {
    setRunningEod(true);
    setError('');
    try {
      const res = await accountingApi.post('/accounting/eod', {});
      setEodResult(res.data);
      await fetchBalance();
    } catch (e) {
      if (e.response?.status === 409) {
        setError('El EOD fue rechazado: el Balance de Comprobación no cuadra. Revise los asientos pendientes.');
      } else {
        setError(e.response?.data?.message || 'Error al ejecutar el proceso de cierre.');
      }
    } finally {
      setRunningEod(false);
    }
  };

  const isBalanced = balance?.balanced === true;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Cierre de Día (EOD)</h1>
        <p className="text-slate-500 mt-1">
          Genera el Balance de Comprobación y ejecuta el cierre operativo diario.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado del EOD ejecutado */}
      {eodResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle size={22} className="text-green-700" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-900">EOD Completado exitosamente</p>
              <p className="text-sm text-green-700">La jornada fue cerrada y la fecha contable avanzó.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fecha cerrada</p>
              <p className="font-bold text-slate-800">{eodResult.contableDateClosed}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nueva fecha contable</p>
              <p className="font-bold text-green-700">{eodResult.nextContableDate}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estado del cuadre</p>
              <p className="font-bold text-green-700">{eodResult.balanceCheck}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total débitos</p>
              <p className="font-bold text-slate-800">${fmt(eodResult.totalDebits)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total créditos</p>
              <p className="font-bold text-slate-800">${fmt(eodResult.totalCredits)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200 md:col-span-1 col-span-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reporte CSV</p>
              <p className="font-mono text-xs text-slate-600 break-all">{eodResult.reportPath}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <FileText size={14} />
            <span>El archivo CSV fue guardado en el servidor. Descarga los reportes:</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`${ENV.ACCOUNTING_API_BASE_URL}/accounting/reports/csv?date=${eodResult.contableDateClosed}`}
              download={`balance_${eodResult.contableDateClosed}.csv`}
              className="inline-flex items-center gap-2 bg-white border border-green-300 hover:bg-green-50 text-green-800 font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <FileSpreadsheet size={16} />
              Descargar CSV
            </a>
            <a
              href={`${ENV.ACCOUNTING_API_BASE_URL}/accounting/reports/pdf?date=${eodResult.contableDateClosed}`}
              download={`balance_${eodResult.contableDateClosed}.pdf`}
              className="inline-flex items-center gap-2 bg-white border border-green-300 hover:bg-green-50 text-green-800 font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Download size={16} />
              Descargar PDF
            </a>
          </div>
        </div>
      )}

      {/* Balance de Comprobación */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarCheck size={22} className="text-blue-800" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Balance de Comprobación</h2>
              {balance && (
                <p className="text-sm text-slate-500">Fecha contable activa: <span className="font-semibold text-slate-700">{balance.contableDate}</span></p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {balance && (
              <>
                <a
                  href={`${ENV.ACCOUNTING_API_BASE_URL}/accounting/reports/csv`}
                  download={`balance_${balance.contableDate}.csv`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-semibold border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
                >
                  <FileSpreadsheet size={14} />
                  CSV
                </a>
                <a
                  href={`${ENV.ACCOUNTING_API_BASE_URL}/accounting/reports/pdf`}
                  download={`balance_${balance.contableDate}.pdf`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-semibold border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Download size={14} />
                  PDF
                </a>
              </>
            )}
            <button
              onClick={fetchBalance}
              disabled={loadingBalance}
              className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-semibold disabled:opacity-50"
            >
              <RefreshCw size={15} className={loadingBalance ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        {loadingBalance && (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando balance...</div>
        )}

        {!loadingBalance && balance && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre de cuenta</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo Deudor</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo Acreedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balance.accounts.map((acc) => (
                    <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-slate-600">{acc.code}</td>
                      <td className="px-6 py-3 text-slate-800">{acc.name}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-800">
                        {Number(acc.debitBalance) > 0 ? `$${fmt(acc.debitBalance)}` : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-800">
                        {Number(acc.creditBalance) > 0 ? `$${fmt(acc.creditBalance)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-bold ${isBalanced ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      ${fmt(balance.totalDebits)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      ${fmt(balance.totalCredits)}
                    </td>
                  </tr>
                  <tr className={isBalanced ? 'bg-green-50' : 'bg-red-50'}>
                    <td colSpan={4} className="px-6 py-3">
                      <div className={`flex items-center gap-2 text-sm font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                        {isBalanced
                          ? <><CheckCircle size={16} /> Balance CUADRADO — Los débitos y créditos son iguales</>
                          : <><XCircle size={16} /> Balance DESCUADRADO — Diferencia: ${fmt(Math.abs(balance.totalDebits - balance.totalCredits))}</>
                        }
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botón EOD */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {isBalanced
                  ? 'El balance cuadra. Puede ejecutar el cierre de día.'
                  : 'El balance no cuadra. Corrija los asientos antes de ejecutar el EOD.'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunEod}
                  disabled={!isBalanced || runningEod}
                  className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap"
                >
                  {runningEod
                    ? <><RefreshCw size={18} className="animate-spin" /> Ejecutando...</>
                    : <><Play size={18} /> Ejecutar EOD</>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EndOfDayPage;
