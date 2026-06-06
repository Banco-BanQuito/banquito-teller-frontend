import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerSearchPage } from './pages/customers/CustomerSearchPage';
import { BranchesPage } from './pages/BranchesPage';
import { TellerOperationPage } from './pages/TellerOperationPage';

import './index.css';

const TellerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: '#f8f9fa' }}>
      <Topbar />
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />

      <main
        className="overflow-auto transition-all duration-300"
        style={{
          marginTop: '4rem',
          marginLeft: isSidebarOpen ? '14rem' : '3.5rem',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <TellerLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'clientes', element: <CustomerSearchPage /> },
        { path: 'ventanilla', element: <TellerOperationPage /> },
        { path: 'sucursales', element: <BranchesPage /> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AuthProvider>
  );
}