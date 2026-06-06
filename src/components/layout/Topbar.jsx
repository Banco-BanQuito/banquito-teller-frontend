import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Topbar = () => {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { user = {}, logout } = auth;
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = ((user?.name || user?.username || 'C')[0]).toUpperCase();

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center justify-between px-8 z-50"
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid #e9ecef',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{
            background: 'linear-gradient(135deg, #0052a3 0%, #001f3f 100%)',
          }}
        >
          B
        </div>

        <div>
          <h1 className="text-lg font-bold text-gray-900 m-0">
            BanQuito Ventanilla
          </h1>
          <p className="text-xs text-gray-500 m-0" style={{ letterSpacing: '1px' }}>
            ATENCIÓN CAJERO
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e9ecef' }}></div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 m-0">
                {user?.name || user?.username || 'Cajero'}
              </p>
              <p className="text-xs text-gray-500 m-0">
                {user?.role || 'CAJERO'}
              </p>
            </div>

            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, #0052a3 0%, #001f3f 100%)',
              }}
            >
              {initials}
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-10"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e9ecef',
              }}
            >
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;