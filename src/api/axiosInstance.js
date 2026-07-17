import axios from 'axios';
import ENV from '../config/environment';

const instance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

function findCoreUserId() {
  // Try several localStorage keys / shapes for historical compatibility
  const candidates = [
    localStorage.getItem('banquito_auth'),
    localStorage.getItem('banquito_session'),
    localStorage.getItem('banquitoSession'),
    localStorage.getItem('banquitoSession'.toLowerCase())
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const obj = JSON.parse(raw);
      // common shapes
      const maybeId = obj?.user?.id || obj?.coreUserId || obj?.userId || obj?.session?.coreUserId || obj?.session?.user?.id || obj?.session?.userId;
      if (maybeId) {
        return String(maybeId);
      }
    } catch (parseErr) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('axios - candidate ignored, parse error:', parseErr.message);
      }
    }
  }
  return null;
}

function findIdToken() {
  try {
    const stored = localStorage.getItem('banquito_auth');
    if (!stored) return null;
    const obj = JSON.parse(stored);
    return obj?.idToken || null;
  } catch {
    return null;
  }
}

function logRequestDebugInfo(config) {
  if (!import.meta.env.DEV) {
    return;
  }
  if (!config.headers['X-Core-User-Id']) {
    // eslint-disable-next-line no-console
    console.warn('axios - No X-Core-User-Id found in localStorage. User may not be authenticated.');
  }
  try {
    const sent = config.headers['X-Core-User-Id'] || null;
    // eslint-disable-next-line no-console
    console.debug('axios - X-Core-User-Id header:', sent, '->', config.method?.toUpperCase(), config.url);
  } catch (logErr) {
    // eslint-disable-next-line no-console
    console.debug('axios - error logging request debug info:', logErr.message);
  }
}

instance.interceptors.request.use((config) => {
  try {
    const coreUserId = findCoreUserId();
    if (coreUserId) {
      config.headers['X-Core-User-Id'] = coreUserId;
    }
    const idToken = findIdToken();
    if (idToken) {
      config.headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (storageErr) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('axios - error reading storage:', storageErr.message);
    }
  }
  logRequestDebugInfo(config);
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      globalThis.dispatchEvent(new CustomEvent('logout'));
    }
    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('axios - API Error response:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      } catch (logErr) {
        // eslint-disable-next-line no-console
        console.debug('axios - error logging API error response:', logErr.message);
      }
      if (error.response?.status >= 500) {
        // eslint-disable-next-line no-console
        console.error('API Server Error:', {
          status: error.response.status,
          message: error.response.data?.message,
          url: error.config?.url,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
