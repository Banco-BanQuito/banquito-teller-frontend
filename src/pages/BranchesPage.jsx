import React from 'react';
import axios from 'axios';
import { Building2, AlertCircle, MapPin } from 'lucide-react';

const partyApi = axios.create({
  baseURL: import.meta.env.VITE_PARTY_API_BASE_URL || 'http://localhost:8083',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    ...(import.meta.env.VITE_APIGEE_API_KEY ? { 'x-api-key': import.meta.env.VITE_APIGEE_API_KEY, apikey: import.meta.env.VITE_APIGEE_API_KEY } : {})
  },
});

export const BranchesPage = () => {
  const [branches, setBranches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await partyApi.get('/api/v2/branches');
        setBranches(response.data || []);
      } catch (err) {
        if (err.response) {
          setError(err.response?.data?.message || 'Error al cargar sucursales.');
        } else {
          setError('No se puede conectar al party-service. Verifique que esté encendido.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const renderBranchesContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-slate-500">
          Cargando sucursales...
        </div>
      );
    }

    if (branches.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500">
          No hay sucursales registradas.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Código</th>
              <th className="p-4 font-semibold text-slate-600">Nombre</th>
              <th className="p-4 font-semibold text-slate-600">Ciudad</th>
              <th className="p-4 font-semibold text-slate-600">Estado</th>
            </tr>
          </thead>

          <tbody>
            {branches.map((branch) => (
              <tr
                key={branch.id || branch.branchCode}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="p-4 font-semibold text-slate-800">
                  {branch.branchCode || branch.code || '-'}
                </td>

                <td className="p-4 text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-800" />
                    {branch.name || '-'}
                  </div>
                </td>

                <td className="p-4 text-slate-700">
                  {branch.city || '-'}
                </td>

                <td className="p-4">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Disponible
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Sucursales
        </h1>
        <p className="text-slate-500 mt-1">
          Consulta las sucursales disponibles para operaciones de ventanilla.
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 size={22} className="text-blue-800" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Lista de sucursales
            </h2>
            <p className="text-sm text-slate-500">
              Información registrada en party-service.
            </p>
          </div>
        </div>

        {renderBranchesContent()}
      </div>
    </div>
  );
};

export default BranchesPage;
