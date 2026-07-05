import React from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Search,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
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

const switchApi = axios.create({
  baseURL: import.meta.env.VITE_SWITCH_API_BASE_URL || 'http://localhost:8010',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
});

// crypto.randomUUID() exige contexto seguro (HTTPS); en HTTP plano no existe.
function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // contexto inseguro, sigue con el fallback
    }
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const isActiveStatus = (status) => {
  const value = String(status || '').toUpperCase();
  return value === 'ACTIVA' || value === 'ACTIVE' || value === 'ACTIVO';
};

const getAccountCardClass = (selected, active) => {
  if (selected) return 'border-blue-500 bg-blue-50';
  if (active) return 'border-slate-200 bg-slate-50 hover:border-blue-300';
  return 'border-red-200 bg-red-50 opacity-70';
};

const getAccountSelectButtonClass = (selected, active) => {
  if (selected) return 'bg-blue-700 text-white';
  if (active) return 'bg-slate-800 hover:bg-slate-900 text-white';
  return 'bg-slate-300 text-slate-500 cursor-not-allowed';
};

const getOperationButtonClass = (operationType) => {
  const baseClass = 'w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl transition';

  if (operationType === 'deposit') {
    return `${baseClass} bg-green-700 hover:bg-green-800 disabled:bg-green-400`;
  }

  if (operationType === 'external') {
    return `${baseClass} bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400`;
  }

  return `${baseClass} bg-red-700 hover:bg-red-800 disabled:bg-red-400`;
};

const getOperationButtonLabel = (operationType, submitting) => {
  if (submitting) {
    return 'Procesando...';
  }

  if (operationType === 'deposit') {
    return 'Depositar';
  }

  if (operationType === 'external') {
    return 'Transferir';
  }

  return 'Retirar';
};

const getOperationButtonIcon = (operationType) => {
  if (operationType === 'deposit') {
    return <ArrowDownCircle size={18} />;
  }

  if (operationType === 'external') {
    return <Landmark size={18} />;
  }

  return <ArrowUpCircle size={18} />;
};

const getOperationEndpoint = (operationType) => {
  if (operationType === 'deposit') {
    return '/accounts/teller/deposit';
  }

  if (operationType === 'external') {
    return '/accounts/transfer/external';
  }

  return '/accounts/teller/withdrawal';
};

const getDefaultReference = (operationType) => {
  if (operationType === 'deposit') {
    return 'Depósito ventanilla';
  }

  if (operationType === 'external') {
    return 'Transferencia interbancaria ventanilla';
  }

  return 'Retiro ventanilla';
};

const getSuccessMessage = (operationType) => {
  if (operationType === 'deposit') {
    return 'Depósito realizado correctamente.';
  }

  if (operationType === 'external') {
    return 'Transferencia interbancaria enviada correctamente.';
  }

  return 'Retiro realizado correctamente.';
};

const getReceiptOperationLabel = (operationType) => {
  if (operationType === 'deposit') {
    return 'Depósito';
  }

  if (operationType === 'external') {
    return 'Transferencia interbancaria';
  }

  return 'Retiro';
};

const buildCustomerName = (data) => {
  return (
    data?.fullName ||
    `${data?.firstName || ''} ${data?.lastName || ''}`.trim() ||
    data?.legalName ||
    '-'
  );
};

const buildCustomerFromHolder = (holder) => ({
  id: holder.customerId,
  customerId: holder.customerId,
  fullName: holder.fullName,
  customerType: holder.customerType,
  status: holder.customerStatus,
  identification: holder.holderIdentification,
});

const getCustomerSearchErrorMessage = (error) => {
  if (!error.response) {
    return 'No se puede conectar al party-service. Verifique que esté encendido.';
  }

  if (error.response.status === 404) {
    return 'Cliente o cuenta no encontrada.';
  }

  return error.response?.data?.message || 'No se pudo consultar el cliente.';
};

const getAccountSearchErrorMessage = (error) => {
  if (!error.response) {
    return 'No se puede conectar al account-core-service o party-service. Verifique que los servicios estén encendidos.';
  }

  if (error.response.status === 404) {
    return 'Cuenta no encontrada.';
  }

  return error.response?.data?.message || 'No se pudo consultar la cuenta.';
};

const getOperationErrorMessage = (error, operationType) => {
  if (!error.response) {
    return 'No se puede conectar al account-core-service. Verifique que esté encendido.';
  }

  const { status, data } = error.response;

  if (status === 400 && operationType === 'withdrawal') {
    return 'Fondos insuficientes para el retiro.';
  }

  if (status === 400) {
    return data?.message || 'Datos inválidos para la operación.';
  }

  if (status === 404) {
    return 'Cuenta no encontrada.';
  }

  if (status === 503) {
    return 'Error en el sistema contable, intente nuevamente.';
  }

  return data?.message || 'Error temporal, intente en unos minutos.';
};

const printReceipt = (receipt) => {
  const isDeposit = receipt.operationType === 'deposit';
  const operationLabel = isDeposit ? 'Depósito en Ventanilla' : 'Retiro en Ventanilla';
  const accentColor = isDeposit ? '#15803d' : '#b91c1c';
  const accentLight = isDeposit ? '#f0fdf4' : '#fff1f2';
  const accentBorder = isDeposit ? '#86efac' : '#fecaca';
  const signSymbol = isDeposit ? '+' : '−';
  const txId = receipt.transactionId || receipt.transactionUuid || '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comprobante BanQuito</title>
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* ── HEADER ── */
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%);
      color: #fff;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 8px 8px 0 0;
    }
    .logo { font-size: 18pt; font-weight: 900; letter-spacing: -0.5px; }
    .logo span { color: #93c5fd; }
    .header-right { text-align: right; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .op-type { font-size: 13pt; font-weight: 700; }
    .op-sub  { font-size: 7.5pt; color: #bfdbfe; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px; }
    /* ── AMOUNT BOX ── */
    .amount-box {
      background: ${accentLight};
      border: 1.5px solid ${accentBorder};
      border-radius: 6px;
      text-align: center;
      padding: 12px 0 10px;
      margin: 14px 0 10px;
    }
    .amount-label { font-size: 7pt; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
    .amount-value { font-size: 28pt; font-weight: 900; color: ${accentColor}; letter-spacing: -1px; }
    .amount-cur   { font-size: 10pt; font-weight: 700; color: ${accentColor}; vertical-align: super; margin-left: 2px; }
    /* ── SECTIONS ── */
    .section-title {
      font-size: 7pt; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.8px;
      margin: 10px 0 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 5px 2px; font-size: 9pt; border-bottom: 1px solid #f1f5f9; }
    td:first-child { color: #64748b; font-weight: 500; width: 44%; }
    td:last-child  { color: #1e293b; font-weight: 600; text-align: right; }
    tr:last-child td { border-bottom: none; }
    /* ── BALANCE ROW ── */
    .balance-row {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin-top: 10px;
    }
    .balance-label { font-size: 8.5pt; color: #475569; font-weight: 500; }
    .balance-val   { font-size: 13pt; font-weight: 900; color: #1e293b; }
    /* ── TX BOX ── */
    .tx-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 12px;
      margin-top: 10px;
    }
    .tx-label { font-size: 7pt; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px; }
    .tx-id    { font-family: 'Courier New', monospace; font-size: 8pt; color: #475569; word-break: break-all; }
    /* ── FOOTER ── */
    .footer {
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0 0;
      margin-top: 12px;
    }
    .footer-note { font-size: 7.5pt; color: #94a3b8; }
    .footer-web  { font-size: 7.5pt; color: #3b82f6; font-weight: 700; }
    /* ── CARD WRAPPER ── */
    .card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .card-body { padding: 0 16px 14px; }
    .status-ok { color: ${accentColor}; font-weight: 700; }
  </style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Ban<span>Quito</span></div>
    <div class="header-right">
      <div><span class="badge">VENTANILLA</span></div>
      <div class="op-type">${operationLabel}</div>
      <div class="op-sub">Comprobante de operación</div>
    </div>
  </div>

  <div class="card-body">
    <div class="amount-box">
      <div class="amount-label">Monto de la operación</div>
      <div class="amount-value">${signSymbol}&nbsp;$${Number(receipt.amount).toFixed(2)}<span class="amount-cur">USD</span></div>
    </div>

    <div class="section-title">Datos del cliente</div>
    <table>
      <tr><td>Cliente</td><td>${receipt.customerName}</td></tr>
      <tr><td>Identificación</td><td>${receipt.customerIdentification || '—'}</td></tr>
      <tr><td>N.º de cuenta</td><td>${receipt.accountNumber || receipt.accountId}</td></tr>
    </table>

    <div class="section-title">Detalles de la transacción</div>
    <table>
      <tr><td>Tipo de operación</td><td>${operationLabel}</td></tr>
      <tr><td>Fecha y hora</td><td>${receipt.dateTime}</td></tr>
      <tr><td>Referencia</td><td>${receipt.reference}</td></tr>
      <tr><td>Estado</td><td class="status-ok">✓ COMPLETADA</td></tr>
    </table>

    <div class="balance-row">
      <span class="balance-label">Saldo disponible tras operación</span>
      <span class="balance-val">$${Number(receipt.newBalance || 0).toFixed(2)} USD</span>
    </div>

    <div class="tx-box">
      <div class="tx-label">N.º de transacción</div>
      <div class="tx-id">${txId}</div>
    </div>

    <div class="footer">
      <span class="footer-note">Conserve este comprobante como respaldo de su operación</span>
      <span class="footer-web">banquito.edu.ec</span>
    </div>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=700,height=860,scrollbars=yes');
  win.focus();
  setTimeout(() => {
    win.print();
    URL.revokeObjectURL(url);
  }, 500);
};

export function TellerOperationPage() {
  const auth = useAuth() || {};
  const { user = {} } = auth;

  const [customerSearch, setCustomerSearch] = React.useState('');
  const [accountSearch, setAccountSearch] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [branchId, setBranchId] = React.useState('1');
  const [banks, setBanks] = React.useState([]);
  const [externalBankCode, setExternalBankCode] = React.useState('');
  const [externalAccountNumber, setExternalAccountNumber] = React.useState('');
  const [beneficiaryFirstName, setBeneficiaryFirstName] = React.useState('');
  const [beneficiaryLastName, setBeneficiaryLastName] = React.useState('');
  const beneficiaryName = `${beneficiaryFirstName.trim()} ${beneficiaryLastName.trim()}`.trim();
  const selectedExternalBank = banks.find((bank) => bank.code === externalBankCode);

  const [customer, setCustomer] = React.useState(null);
  const [customerAccounts, setCustomerAccounts] = React.useState(null);
  const [accountHolder, setAccountHolder] = React.useState(null);
  const [balance, setBalance] = React.useState(null);
  const [operationType, setOperationType] = React.useState('deposit');

  const [message, setMessage] = React.useState('');
  const [loadingCustomer, setLoadingCustomer] = React.useState(false);
  const [loadingAccounts, setLoadingAccounts] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);

  const tellerId = user?.id || user?.coreUserId || 1;

  React.useEffect(() => {
    switchApi.get('/api/v2/payments/routing-codes')
      .then((response) => {
        const externalBanks = (response.data || []).filter((bank) => bank.valueString === 'OFF_US');
        setBanks(externalBanks);
        if (externalBanks.length > 0) {
          setExternalBankCode(externalBanks[0].code);
        }
      })
      .catch(() => setBanks([]));
  }, []);

  const fetchCustomerAccounts = async (customerId) => {
    setLoadingAccounts(true);
    setCustomerAccounts(null);
    setBalance(null);
    setAccountHolder(null);
    try {
      const response = await accountApi.get(`/accounts/customer/${customerId}`);
      setCustomerAccounts(response.data || []);
    } catch {
      setCustomerAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSelectAccount = (acc) => {
    setAccountSearch(String(acc.accountId));
    setBalance({
      accountId: acc.accountId,
      accountNumber: acc.accountNumber,
      availableBalance: acc.availableBalance,
      accountingBalance: acc.accountingBalance,
      status: acc.status,
      currency: acc.currency,
    });
    setReceipt(null);
    setMessage(
      isActiveStatus(acc.status)
        ? 'Cuenta seleccionada correctamente.'
        : 'La cuenta no está activa. No se puede realizar depósito ni retiro.'
    );
  };

  const handleSearchCustomer = async () => {
    setMessage('');
    setCustomer(null);
    setCustomerAccounts(null);
    setBalance(null);
    setReceipt(null);

    if (!customerSearch.trim()) {
      setMessage('Ingrese una cédula, RUC, ID de cliente o número de cuenta.');
      return;
    }

    setLoadingCustomer(true);

    try {
      const response = await partyApi.get(`/api/v2/customers/${customerSearch.trim()}`);
      const found = response.data;
      setCustomer(found);
      setMessage('Cliente encontrado correctamente.');
      await fetchCustomerAccounts(found.id || found.customerId);
    } catch (firstError) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('Customer search by id failed, trying by-account fallback:', firstError.message);
      }
      try {
        const response = await partyApi.get(`/api/v2/customers/by-account/${customerSearch.trim()}`);
        const holder = response.data;

        setAccountHolder(holder);
        setAccountSearch(String(holder.accountId || holder.accountNumber || ''));
        setCustomer(buildCustomerFromHolder(holder));
        setMessage('Cliente encontrado por número de cuenta.');
        await fetchCustomerAccounts(holder.customerId);
      } catch (error) {
        setMessage(getCustomerSearchErrorMessage(error));
      }
    } finally {
      setLoadingCustomer(false);
    }
  };


  const validateOperationForm = () => {
    if (!customer) {
      return 'Primero debe buscar un cliente o una cuenta.';
    }

    if (!balance) {
      return 'Primero debe consultar la cuenta y su saldo.';
    }

    if (!isActiveStatus(balance.status)) {
      return 'La cuenta no está activa. No se puede realizar la operación.';
    }

    if (!amount || Number(amount) <= 0) {
      return 'Ingrese un monto válido.';
    }

    if (operationType === 'withdrawal' && Number(amount) > Number(balance.availableBalance)) {
      return 'Fondos insuficientes para el retiro.';
    }

    if (operationType === 'external') {
      if (!externalBankCode) {
        return 'Seleccione el banco destino.';
      }
      if (!externalAccountNumber.trim()) {
        return 'Ingrese el número de cuenta externa.';
      }
      if (!beneficiaryFirstName.trim()) {
        return 'Ingrese los nombres del beneficiario.';
      }
      if (!beneficiaryLastName.trim()) {
        return 'Ingrese los apellidos del beneficiario.';
      }
    }

    return '';
  };

  const buildOperationPayload = () => {
    if (operationType === 'external') {
      const bank = banks.find((b) => b.code === externalBankCode);
      return {
        originAccountId: Number(balance.accountId || accountHolder?.accountId || accountSearch),
        externalBankCode,
        externalBankName: bank?.name || externalBankCode,
        externalAccountNumber: externalAccountNumber.trim(),
        beneficiaryName: beneficiaryName.trim(),
        amount: Number(amount),
        transactionUuid: generateUuid(),
        reference: reference.trim() || getDefaultReference(operationType),
      };
    }

    return {
      accountId: Number(balance.accountId || accountHolder?.accountId || accountSearch),
      amount: Number(amount),
      tellerId: Number(tellerId),
      branchId: Number(branchId),
      transactionUuid: generateUuid(),
      reference: reference.trim() || getDefaultReference(operationType),
    };
  };

  const buildReceipt = (responseData, payload) => ({
    ...responseData,
    operationType,
    amount: Number(amount),
    customerName: buildCustomerName(customer),
    customerIdentification: customer.identification,
    accountId: payload.accountId || payload.originAccountId,
    accountNumber: balance.accountNumber || accountHolder?.accountNumber,
    reference: payload.reference,
    transactionUuid: payload.transactionUuid,
    externalBankName: payload.externalBankName,
    externalAccountNumber: payload.externalAccountNumber,
    beneficiaryName: payload.beneficiaryName,
    dateTime: new Date().toLocaleString('es-EC'),
  });

  const refreshBalance = async (accountId) => {
    const balanceResponse = await accountApi.get(`/accounts/${accountId}/balance`);
    setBalance(balanceResponse.data);
    setCustomerAccounts(prev =>
      prev
        ? prev.map(acc =>
            acc.accountId === accountId
              ? { ...acc, availableBalance: balanceResponse.data.availableBalance, accountingBalance: balanceResponse.data.accountingBalance }
              : acc
          )
        : prev
    );
  };

  const handleSubmitOperation = async (event) => {
    event.preventDefault();
    setMessage('');
    setReceipt(null);

    const validationMessage = validateOperationForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const payload = buildOperationPayload();
    const endpoint = getOperationEndpoint(operationType);

    setSubmitting(true);

    try {
      const response = await accountApi.post(endpoint, payload);

      setReceipt(buildReceipt(response.data, payload));
      setMessage(getSuccessMessage(operationType));
      await refreshBalance(payload.accountId || payload.originAccountId);

      setAmount('');
      setReference('');
      setExternalAccountNumber('');
      setBeneficiaryFirstName('');
      setBeneficiaryLastName('');
    } catch (error) {
      setMessage(getOperationErrorMessage(error, operationType));
    } finally {
      setSubmitting(false);
    }
  };

  const accountIsBlocked = balance && !isActiveStatus(balance.status);
  const operationButtonClass = getOperationButtonClass(operationType);
  const operationButtonIcon = getOperationButtonIcon(operationType);
  const operationButtonLabel = getOperationButtonLabel(operationType, submitting);

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
              <h2 className="text-xl font-bold text-slate-800">Cuentas del cliente</h2>
              <p className="text-sm text-slate-500">
                Seleccione la cuenta para operar.
              </p>
            </div>
          </div>

          {!customer && (
            <p className="text-sm text-slate-400 italic">Primero busque un cliente.</p>
          )}

          {loadingAccounts && (
            <p className="text-sm text-slate-500">Cargando cuentas...</p>
          )}

          {customerAccounts !== null && !loadingAccounts && customerAccounts.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">Este cliente no tiene cuentas registradas.</p>
            </div>
          )}

          {customerAccounts && customerAccounts.length > 0 && (
            <div className="space-y-3">
              {customerAccounts.map((acc) => {
                const active = isActiveStatus(acc.status);
                const selected = balance?.accountId === acc.accountId;
                return (
                  <div
                    key={acc.accountId}
                    className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition
                      ${getAccountCardClass(selected, active)}`}
                  >
                    <div className="text-sm text-slate-700 space-y-1">
                      <p className="font-semibold text-slate-900">{acc.accountNumber}</p>
                      <p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                          {String(acc.status?.value || acc.status || '').toUpperCase()}
                        </span>
                      </p>

                    </div>

                    <button
                      type="button"
                      disabled={!active}
                      onClick={() => handleSelectAccount(acc)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition
                        ${getAccountSelectButtonClass(selected, active)}`}
                    >
                      {selected ? 'Seleccionada' : 'Seleccionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {balance && (
            <div className={`${accountIsBlocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-xl p-3`}>
              <p className={`text-xs font-semibold ${accountIsBlocked ? 'text-red-700' : 'text-green-700'}`}>
                {accountIsBlocked ? 'Cuenta inactiva — operación bloqueada' : 'Cuenta activa'}
              </p>
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
            Seleccione si desea realizar depósito, retiro o una transferencia a otro banco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="op-type-select" className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de operación
            </label>

            <select
              id="op-type-select"
              value={operationType}
              onChange={(event) => {
                setOperationType(event.target.value);
                setReceipt(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="deposit">Depósito</option>
              <option value="withdrawal">Retiro</option>
              <option value="external">Transferencia a otro banco</option>
            </select>
          </div>

          <div>
            <label htmlFor="op-amount-input" className="block text-sm font-medium text-slate-700 mb-2">
              Monto
            </label>

            <input
              id="op-amount-input"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {operationType === 'external' ? (
            <div>
              <label htmlFor="op-external-bank-select" className="block text-sm font-medium text-slate-700 mb-2">
                Banco destino
              </label>

              <select
                id="op-external-bank-select"
                value={externalBankCode}
                onChange={(event) => setExternalBankCode(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                {banks.length === 0 && <option value="">Sin bancos disponibles</option>}
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
              {selectedExternalBank?.description && (
                <p className="text-xs text-slate-500 mt-2">{selectedExternalBank.description}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="op-branch-select" className="block text-sm font-medium text-slate-700 mb-2">
                Sucursal
              </label>

              <select
                id="op-branch-select"
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
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting || accountIsBlocked}
              className={operationButtonClass}
            >
              {operationButtonIcon}
              {operationButtonLabel}
            </button>
          </div>
        </div>

        {operationType === 'external' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="op-external-account-input" className="block text-sm font-medium text-slate-700 mb-2">
                Número de cuenta externa
              </label>
              <input
                id="op-external-account-input"
                type="text"
                value={externalAccountNumber}
                onChange={(event) => setExternalAccountNumber(event.target.value)}
                placeholder="Cuenta en el banco destino"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label htmlFor="op-beneficiary-firstname-input" className="block text-sm font-medium text-slate-700 mb-2">
                Nombres del beneficiario
              </label>
              <input
                id="op-beneficiary-firstname-input"
                type="text"
                value={beneficiaryFirstName}
                onChange={(event) => setBeneficiaryFirstName(event.target.value)}
                placeholder="Ej. Wendy Pamela"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label htmlFor="op-beneficiary-lastname-input" className="block text-sm font-medium text-slate-700 mb-2">
                Apellidos del beneficiario
              </label>
              <input
                id="op-beneficiary-lastname-input"
                type="text"
                value={beneficiaryLastName}
                onChange={(event) => setBeneficiaryLastName(event.target.value)}
                placeholder="Ej. Herrera Quinte"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <p className="md:col-span-2 text-xs text-slate-500">
              Se cobrará una comisión fija de $0.60 + IVA sobre la transferencia.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="op-reference-textarea" className="block text-sm font-medium text-slate-700 mb-2">
            Referencia
          </label>

          <textarea
            id="op-reference-textarea"
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
            <p><span className="font-medium">Operación:</span> {getReceiptOperationLabel(receipt.operationType)}</p>
            <p><span className="font-medium">Monto:</span> ${Number(receipt.amount).toFixed(2)}</p>
            <p><span className="font-medium">Cliente:</span> {receipt.customerName}</p>
            <p><span className="font-medium">Identificación:</span> {receipt.customerIdentification || '-'}</p>
            <p><span className="font-medium">Cuenta:</span> {receipt.accountNumber || receipt.accountId}</p>
            <p><span className="font-medium">Nuevo saldo:</span> ${Number(receipt.newBalance || receipt.remainingBalance || receipt.availableBalance || 0).toFixed(2)}</p>
            {receipt.operationType === 'external' && (
              <>
                <p><span className="font-medium">Banco destino:</span> {receipt.externalBankName}</p>
                <p><span className="font-medium">Cuenta externa:</span> {receipt.externalAccountNumber}</p>
                <p><span className="font-medium">Beneficiario:</span> {receipt.beneficiaryName}</p>
                <p><span className="font-medium">Comisión:</span> ${Number(receipt.commissionAmount || 0).toFixed(2)}</p>
              </>
            )}
            <p className="md:col-span-2"><span className="font-medium">Referencia:</span> {receipt.reference}</p>
          </div>

          <button
            type="button"
            onClick={() => printReceipt(receipt)}
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