const ENV = {
  API_BASE_URL: import.meta.env.VITE_ACCOUNT_API_BASE_URL || 'http://localhost:8081/api/v2',
  PARTY_API_BASE_URL: import.meta.env.VITE_PARTY_API_BASE_URL || 'http://localhost:8083',
  ACCOUNTING_API_BASE_URL: import.meta.env.VITE_ACCOUNTING_API_BASE_URL || 'http://localhost:8082/api/v2',
  SWITCH_API_BASE_URL: import.meta.env.VITE_SWITCH_API_BASE_URL || 'http://localhost:8010',
  API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 10000,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Banquito Teller Frontend',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || false,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN_STAFF: '/auth/login/staff',
    LOGIN_CUSTOMER: '/auth/login',
  },

  CUSTOMERS: {
    GET_ALL: '/customers',
    GET: (id) => `/customers/${id}`,
    SEARCH: (type, identification) => `/customers/identification/${type}/${identification}`,
    CREATE: '/customers',
    UPDATE: (id) => `/customers/${id}`,
    SUBTYPES: '/customers/subtypes',
  },

  ACCOUNTS: {
    GET: (accountNumber) => `/accounts/${accountNumber}`,
    BALANCE: (accountId) => `/accounts/${accountId}/balance`,
    CREATE: '/accounts',
    GET_BY_CUSTOMER: (customerId) => `/accounts/customer/${customerId}`,
    TELLER_DEPOSIT: '/accounts/teller/deposit',
    TELLER_WITHDRAWAL: '/accounts/teller/withdrawal',
  },

  BRANCHES: {
    GET_ALL: '/branches',
    GET: (code) => `/branches/${code}`,
    CREATE: '/branches',
  },

  HOLIDAYS: {
    GET_ALL: '/holidays',
    CHECK_BUSINESS_DAY: (date) => `/holidays/business-day?date=${date}`,
  },
};

export default ENV;