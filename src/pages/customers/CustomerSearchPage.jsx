import React from 'react';
import axios from 'axios';
import { Search, UserCheck, AlertCircle, CreditCard } from 'lucide-react';

const partyApi = axios.create({
  baseURL: import.meta.env.VITE_PARTY_API_BASE_URL || 'http://localhost:8083',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    ...(import.meta.env.VITE_APIGEE_API_KEY ? { 'x-api-key': import.meta.env.VITE_APIGEE_API_KEY, apikey: import.meta.env.VITE_APIGEE_API_KEY } : {})
  },
});

const buildCustomerFromHolder = (holder) => ({
  id: holder.customerId,
  customerId: holder.customerId,
  fullName: holder.fullName,
  customerType: holder.customerType,
  status: holder.customerStatus,
  identification: holder.holderIdentification,
  accountNumber: holder.accountNumber,
});

export function CustomerSearchPage() {
  const [searchValue, setSearchValue] = React.useState('');
  const [customer, setCustomer] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [foundByAccount, setFoundByAccount] = React.useState(false);

  const handleSearch = async () => {
    setMessage('');
    setCustomer(null);
    setFoundByAccount(false);

    if (!searchValue.trim()) {
      setMessage('Ingrese una cédula, RUC, ID del cliente o número de cuenta.');
      return;
    }

    setLoading(true);

    try {
      const response = await partyApi.get(`/api/v2/customers/${searchValue.trim()}`);
      setCustomer(response.data);
      setMessage('Cliente encontrado correctamente.');
    } catch {
      try {
        const response = await partyApi.get(`/api/v2/customers/by-account/${searchValue.trim()}`);
        setCustomer(buildCustomerFromHolder(response.data));
        setFoundByAccount(true);
        setMessage('Cliente encontrado por número de cuenta.');
      } catch (error) {
        if (!error.response) {
          setMessage('No se puede conectar al party-service. Verifique que esté encendido.');
        } else if (error.response.status === 404) {
          setMessage('Cliente o cuenta no encontrada.');
        } else {
          setMessage(error.response?.data?.message || 'No se pudo consultar el cliente.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleSearch();
  };

  const fullName =
    customer?.fullName ||
    `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
    customer?.legalName ||
    '-';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Buscar Cliente
        </h1>
        <p className="text-slate-500 mt-1">
          Consulta la información principal del cliente antes de realizar una operación de ventanilla.
        </p>
      </div>

      {message && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${
          message.includes('encontrado')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-3xl">
        <div>
          <label htmlFor="customer-search-input" className="block text-sm font-medium text-slate-700 mb-2">
            Cédula, RUC, ID de cliente o número de cuenta
          </label>

          <div className="flex gap-3">
            <input
              id="customer-search-input"
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ejemplo: 1, 0000000001 o 0010000001"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-semibold px-5 py-3 rounded-xl transition"
            >
              <Search size={18} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {customer && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserCheck size={22} className="text-blue-800" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Información del cliente
              </h2>
              <p className="text-sm text-slate-500">
                Datos obtenidos desde party-service.
              </p>
            </div>
          </div>

          {foundByAccount && customer.accountNumber && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 text-sm text-blue-800">
              <CreditCard size={15} className="shrink-0" />
              <span>Cuenta buscada: <span className="font-mono font-bold">{customer.accountNumber}</span></span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <p><span className="font-medium">ID:</span> {customer.id || customer.customerId || '-'}</p>
            <p><span className="font-medium">Nombre:</span> {fullName}</p>
            <p><span className="font-medium">Identificación:</span> {customer.identification || '-'}</p>
            <p><span className="font-medium">Tipo cliente:</span> {customer.customerType?.value || customer.customerType || '-'}</p>
            <p><span className="font-medium">Correo:</span> {customer.email || '-'}</p>
            <p><span className="font-medium">Teléfono:</span> {customer.mobilePhone || '-'}</p>
            <p><span className="font-medium">Estado:</span> {customer.status?.value || customer.status || 'ACTIVO'}</p>
            <p><span className="font-medium">Dirección:</span> {customer.address || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSearchPage;
