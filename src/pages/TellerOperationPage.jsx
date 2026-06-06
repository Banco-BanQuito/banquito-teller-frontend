import React from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Search,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
  AlertCircle,
} from 'lucide-react';

const partyApi = axios.create({
  baseURL: import.meta.env.VITE_PARTY_API_BASE_URL || 'http://localhost:8083',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
});

const accountApi = axios.create({
  baseURL: import.meta.env.VITE_ACCOUNT_API_BASE_URL || 'http://localhost:8081/api/v2',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
});

const isActiveStatus = (status) => {
  const value = String(status || '').toUpperCase();
  return value === 'ACTIVA' || value === 'ACTIVE' || value === 'ACTIVO';
};

export function TellerOperationPage() {
  const auth = useAuth() || {};
  const { user = {} } = auth;

  const [customerSearch, setCustomerSearch] = React.useState('');
  const [accountSearch, setAccountSearch] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [branchId, setBranchId] = React.useState('1');

  const [customer, setCustomer] = React.useState(null);
  const [accountHolder, setAccountHolder] = React.useState(null);
  const [balance, setBalance] = React.useState(null);
  const [operationType, setOperationType] = React.useState('deposit');

  const [message, setMessage] = React.useState('');
  const [loadingCustomer, setLoadingCustomer] = React.useState(false);
  const [loadingAccount, setLoadingAccount] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);

  const tellerId = user?.id || user?.coreUserId || 1;

  const buildCustomerName = (data) => {
    return (
      data?.fullName ||
      `${data?.firstName || ''} ${data?.lastName || ''}`.trim() ||
      data?.legalName ||
      '-'
    );
  };

  const handleSearchCustomer = async () => {
    setMessage('');
    setCustomer(null);
    setReceipt(null);

    if (!customerSearch.trim()) {
      setMessage('Ingrese una cédula, RUC, ID de cliente o número de cuenta.');
      return;
    }

    setLoadingCustomer(true);

    try {
      try {
        const response = await partyApi.get(`/api/v2/customers/${customerSearch.trim()}`);
        setCustomer(response.data);
        setMessage('Cliente encontrado correctamente.');
      } catch (firstError) {
        const response = await partyApi.get(`/api/v2/customers/by-account/${customerSearch.trim()}`);
        const holder = response.data;

        setAccountHolder(holder);
        setAccountSearch(String(holder.accountId || holder.accountNumber || ''));

        setCustomer({
          id: holder.customerId,
          customerId: holder.customerId,
          fullName: holder.fullName,
          customerType: holder.customerType,
          status: holder.customerStatus,
          identification: holder.holderIdentification,
        });

        setMessage('Cliente encontrado por número de cuenta.');
      }
    } catch (error) {
      if (!error.response) {
        setMessage('No se puede conectar al party-service. Verifique que esté encendido.');
      } else if (error.response.status === 404) {
        setMessage('Cliente o cuenta no encontrada.');
      } else {
        setMessage(error.response?.data?.message || 'No se pudo consultar el cliente.');
      }
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleSearchAccount = async () => {
    setMessage('');
    setBalance(null);
    setAccountHolder(null);
    setReceipt(null);

    if (!accountSearch.trim()) {
      setMessage('Ingrese el ID o número de cuenta.');
      return;
    }

    setLoadingAccount(true);

    try {
      let accountIdForBalance = accountSearch.trim();

      if (accountSearch.trim().length > 6) {
        const holderResponse = await partyApi.get(`/api/v2/customers/by-account/${accountSearch.trim()}`);
        const holder = holderResponse.data;

        setAccountHolder(holder);
        accountIdForBalance = String(holder.accountId);

        setCustomer({
          id: holder.customerId,
          customerId: holder.customerId,
          fullName: holder.fullName,
          customerType: holder.customerType,
          status: holder.customerStatus,
          identification: holder.holderIdentification,
        });
      }

      const balanceResponse = await accountApi.get(`/accounts/${accountIdForBalance}/balance`);
      setBalance(balanceResponse.data);

      if (!isActiveStatus(balanceResponse.data?.status)) {
        setMessage('La cuenta no está activa. No se puede realizar depósito ni retiro.');
        return;
      }

      setMessage('Cuenta consultada correctamente.');
    } catch (error) {
      if (!error.response) {
        setMessage('No se puede conectar al account-core-service o party-service. Verifique que los servicios estén encendidos.');
      } else if (error.response.status === 404) {
        setMessage('Cuenta no encontrada.');
      } else {
        setMessage(error.response?.data?.message || 'No se pudo consultar la cuenta.');
      }
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleSubmitOperation = async (event) => {
    event.preventDefault();
    setMessage('');
    setReceipt(null);

    if (!customer) {
      setMessage('Primero debe buscar un cliente o una cuenta.');
      return;
    }

    if (!balance) {
      setMessage('Primero debe consultar la cuenta y su saldo.');
      return;
    }

    if (!isActiveStatus(balance.status)) {
      setMessage('La cuenta no está activa. No se puede realizar la operación.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage('Ingrese un monto válido.');
      return;
    }

    if (operationType === 'withdrawal' && Number(amount) > Number(balance.availableBalance)) {
      setMessage('Fondos insuficientes para el retiro.');
      return;
    }

    const payload = {
      accountId: Number(balance.accountId || accountHolder?.accountId || accountSearch),
      amount: Number(amount),
      tellerId: Number(tellerId),
      branchId: Number(branchId),
      transactionUuid: crypto.randomUUID(),
      reference: reference.trim() || (operationType === 'deposit' ? 'Depósito ventanilla' : 'Retiro ventanilla'),
    };

    const endpoint =
      operationType === 'deposit'
        ? '/accounts/teller/deposit'
        : '/accounts/teller/withdrawal';

    setSubmitting(true);

    try {
      const response = await accountApi.post(endpoint, payload);

      setReceipt({
        ...response.data,
        operationType,
        amount: Number(amount),
        customerName: buildCustomerName(customer),
        customerIdentification: customer.identification,
        accountId: payload.accountId,
        accountNumber: balance.accountNumber || accountHolder?.accountNumber,
        reference: payload.reference,
        transactionUuid: payload.transactionUuid,
        dateTime: new Date().toLocaleString('es-EC'),
      });

      setMessage(
        operationType === 'deposit'
          ? 'Depósito realizado correctamente.'
          : 'Retiro realizado correctamente.'
      );

      const balanceResponse = await accountApi.get(`/accounts/${payload.accountId}/balance`);
      setBalance(balanceResponse.data);

      setAmount('');
      setReference('');
    } catch (error) {
      if (!error.response) {
        setMessage('No se puede conectar al account-core-service. Verifique que esté encendido.');
      } else if (error.response.status === 400) {
        setMessage(
          operationType === 'withdrawal'
            ? 'Fondos insuficientes para el retiro.'
            : error.response?.data?.message || 'Datos inválidos para la operación.'
        );
      } else if (error.response.status === 404) {
        setMessage('Cuenta no encontrada.');
      } else if (error.response.status === 503) {
        setMessage('Error en el sistema contable, intente nuevamente.');
      } else {
        setMessage(error.response?.data?.message || 'Error temporal, intente en unos minutos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const accountIsBlocked = balance && !isActiveStatus(balance.status);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Operaciones de Ventanilla
        </h1>
        <p className="text-slate-500 mt-1">
          Busca el cliente por identificación o cuenta, verifica el saldo y registra depósitos o retiros.
        </p>
      </div>

      {message && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Search size={22} className="text-blue-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Buscar cliente</h2>
              <p className="text-sm text-slate-500">
                Ingrese ID, cédula, RUC o número de cuenta.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Ejemplo: 1, 0000000001 o 2200000001"
              className="w-full min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />

            <button
              type="button"
              onClick={handleSearchCustomer}
              disabled={loadingCustomer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-semibold px-5 py-3 rounded-xl transition whitespace-nowrap"
            >
              <Search size={18} />
              {loadingCustomer ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {customer && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-900 mb-3">Cliente encontrado</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-950">
                <p><span className="font-medium">Nombre:</span> {buildCustomerName(customer)}</p>
                <p><span className="font-medium">Identificación:</span> {customer.identification || '-'}</p>
                <p><span className="font-medium">Tipo:</span> {customer.customerType?.value || customer.customerType || '-'}</p>
                <p><span className="font-medium">Estado cliente:</span> {customer.status?.value || customer.status || 'ACTIVO'}</p>
                <p className="md:col-span-2"><span className="font-medium">Correo:</span> {customer.email || '-'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Banknote size={22} className="text-blue-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Consultar cuenta</h2>
              <p className="text-sm text-slate-500">
                Ingrese ID de cuenta o número de cuenta.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={accountSearch}
              onChange={(event) => {
                setAccountSearch(event.target.value);
                setBalance(null);
                setAccountHolder(null);
                setReceipt(null);
                setMessage('');
              }}
              placeholder="Ejemplo: 1 o 2200000001"
              className="w-full min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />

            <button
              type="button"
              onClick={handleSearchAccount}
              disabled={loadingAccount}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold px-5 py-3 rounded-xl transition whitespace-nowrap"
            >
              <Search size={18} />
              {loadingAccount ? 'Consultando...' : 'Saldo'}
            </button>
          </div>

          {balance && (
            <div className={`${accountIsBlocked ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
              <p className={`font-semibold mb-3 ${accountIsBlocked ? 'text-red-800' : 'text-slate-800'}`}>
                Datos de cuenta
              </p>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${accountIsBlocked ? 'text-red-900' : 'text-slate-700'}`}>
                <p><span className="font-medium">Cuenta:</span> {balance.accountNumber || accountHolder?.accountNumber || accountSearch}</p>
                <p><span className="font-medium">Estado:</span> {balance.status || '-'}</p>
                <p><span className="font-medium">Saldo disponible:</span> ${Number(balance.availableBalance || 0).toFixed(2)}</p>
                <p><span className="font-medium">Saldo contable:</span> ${Number(balance.accountingBalance || 0).toFixed(2)}</p>
              </div>

              {accountIsBlocked && (
                <p className="text-sm text-red-800 mt-3 font-medium">
                  Esta cuenta no está activa, por lo tanto la operación queda bloqueada.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmitOperation}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Registrar operación
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Seleccione si desea realizar depósito o retiro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de operación
            </label>

            <select
              value={operationType}
              onChange={(event) => {
                setOperationType(event.target.value);
                setReceipt(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="deposit">Depósito</option>
              <option value="withdrawal">Retiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto
            </label>

            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sucursal
            </label>

            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="1">NORTE</option>
              <option value="2">SUR</option>
              <option value="3">CENTRO</option>
              <option value="4">VALLES</option>
              <option value="5">DIGITAL</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting || accountIsBlocked}
              className={`w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl transition ${
                operationType === 'deposit'
                  ? 'bg-green-700 hover:bg-green-800 disabled:bg-green-400'
                  : 'bg-red-700 hover:bg-red-800 disabled:bg-red-400'
              }`}
            >
              {operationType === 'deposit' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              {submitting ? 'Procesando...' : operationType === 'deposit' ? 'Depositar' : 'Retirar'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Referencia
          </label>

          <textarea
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Ejemplo: Operación en ventanilla"
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
          />
        </div>
      </form>

      {receipt && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ReceiptText size={22} className="text-green-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900">
                Comprobante digital
              </h2>
              <p className="text-sm text-green-700">
                Operación registrada correctamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
            <p><span className="font-medium">Transacción:</span> {receipt.transactionId || receipt.transactionUuid}</p>
            <p><span className="font-medium">Fecha/Hora:</span> {receipt.dateTime}</p>
            <p><span className="font-medium">Operación:</span> {receipt.operationType === 'deposit' ? 'Depósito' : 'Retiro'}</p>
            <p><span className="font-medium">Monto:</span> ${Number(receipt.amount).toFixed(2)}</p>
            <p><span className="font-medium">Cliente:</span> {receipt.customerName}</p>
            <p><span className="font-medium">Identificación:</span> {receipt.customerIdentification || '-'}</p>
            <p><span className="font-medium">Cuenta:</span> {receipt.accountNumber || receipt.accountId}</p>
            <p><span className="font-medium">Nuevo saldo:</span> ${Number(receipt.newBalance || receipt.availableBalance || 0).toFixed(2)}</p>
            <p className="md:col-span-2"><span className="font-medium">Referencia:</span> {receipt.reference}</p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="mt-5 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl transition"
          >
            <ReceiptText size={18} />
            Imprimir comprobante
          </button>
        </div>
      )}
    </div>
  );
}

export default TellerOperationPage;