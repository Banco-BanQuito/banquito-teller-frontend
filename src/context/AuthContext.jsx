import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContextObject';
import { loginStaff } from '../api/authApi';

const STORAGE_KEY = 'banquito_auth';

const DEFAULT_AUTH = {
  isAuthenticated: false,
  portal: null,
  user: null,
};

function loadStoredAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_AUTH;
  } catch {
    return DEFAULT_AUTH;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);

  const login = useCallback(async (username, password) => {
    try {
      const res = await loginStaff(username, password);
      const data = res.data;

      const userData = {
        id: data.coreUserId,
        name: data.fullName,
        username: data.username,
        role: data.role,
        status: typeof data.status === 'string' ? data.status : data.status?.toString() || 'ACTIVO',
      };

      const newAuth = {
        isAuthenticated: true,
        portal: 'operador',
        user: userData,
      };

      setAuth(newAuth);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuth));

      return userData;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error en login de cajero:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.response?.data?.message,
          data: err.response?.data,
          url: err.config?.url,
        });
      }

      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const newAuth = {
      isAuthenticated: false,
      portal: null,
      user: null,
    };

    setAuth(newAuth);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [logout]);

  const contextValue = useMemo(() => ({
    ...auth,
    login,
    logout,
  }), [auth, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}