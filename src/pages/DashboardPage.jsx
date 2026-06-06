import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Search,
  Landmark,
  Building2,
  ArrowRight,
  UserCheck,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';

const modules = [
  {
    title: 'Buscar Cliente',
    description: 'Consulta un cliente por identificación o código registrado.',
    path: '/clientes',
    Icon: Search,
  },
  {
    title: 'Operaciones de Ventanilla',
    description: 'Realiza depósitos o retiros sobre una cuenta bancaria.',
    path: '/ventanilla',
    Icon: Landmark,
  },
  {
    title: 'Sucursales',
    description: 'Consulta las sucursales disponibles para atención.',
    path: '/sucursales',
    Icon: Building2,
  },
];

export function DashboardPage() {
  const auth = useAuth() || {};
  const { user = {} } = auth;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-800 to-slate-950 rounded-2xl p-8 text-white shadow-sm">
        <h1 className="text-3xl font-bold">
          Panel de Ventanilla
        </h1>

        <p className="text-blue-100 mt-2">
          Bienvenido, {user?.name || user?.username || 'Cajero'}. Desde aquí puedes consultar clientes y registrar operaciones de caja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserCheck size={22} className="text-blue-800" />
            </div>
            <h3 className="font-bold text-slate-800">Cajero</h3>
          </div>

          <p className="text-sm text-slate-500">Usuario activo</p>
          <p className="text-lg font-semibold text-slate-800">
            {user?.username || '-'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ReceiptText size={22} className="text-blue-800" />
            </div>
            <h3 className="font-bold text-slate-800">Operaciones</h3>
          </div>

          <p className="text-sm text-slate-500">Depósitos y retiros</p>
          <p className="text-lg font-semibold text-slate-800">
            Ventanilla
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShieldCheck size={22} className="text-blue-800" />
            </div>
            <h3 className="font-bold text-slate-800">Estado</h3>
          </div>

          <p className="text-sm text-slate-500">Sesión</p>
          <p className="text-lg font-semibold text-green-700">
            {user?.status || 'ACTIVA'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Accesos rápidos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map(({ path, title, description, Icon }) => (
            <div
              key={path}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon size={22} className="text-blue-800" />
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              </div>

              <Link
                to={path}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 hover:text-blue-950 transition-colors"
              >
                Acceder
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;