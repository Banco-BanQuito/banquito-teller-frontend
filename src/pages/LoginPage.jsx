import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import heroImage from '../assets/banquito3.webp';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth() || {};

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'BanQuito Ventanilla';

    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Ingrese su usuario.');
      return;
    }

    if (!password) {
      setError('Ingrese su contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (login) {
        await login(username.trim(), password);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error en login:', err.response?.status, err.response?.data);
      }

      if (!err.response) {
        setError('No se puede conectar al servidor. Verifique que el servicio esté encendido.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Usuario o contraseña incorrectos.');
      } else if (err.response?.status === 404) {
        setError('El servicio de autenticación de cajero no está disponible.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Solicitud inválida. Verifique los datos.');
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión. Por favor, intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-800 to-slate-950 items-center justify-center p-8">
        <div className="text-center">
          <img
            src={heroImage}
            alt="BanQuito"
            className="rounded-lg shadow-2xl max-h-96 object-cover"
          />

          <h1 className="text-4xl font-bold text-white mt-6">
            BanQuito Ventanilla
          </h1>

          <p className="text-blue-100 mt-2">
            Atención de caja para personal autorizado
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Ingreso Cajero
            </h2>

            <p className="text-gray-600 mt-2">
              Acceso al módulo de operaciones de ventanilla
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ejemplo: cajero.norte"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingrese su contraseña"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent disabled:bg-gray-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white font-semibold py-3 rounded-lg hover:bg-blue-900 disabled:bg-gray-400 transition duration-200"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-4">
            ¿Problemas de acceso? Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;