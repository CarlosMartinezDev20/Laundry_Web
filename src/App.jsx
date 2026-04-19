import { Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';
import { GlobalLoader } from './components/UI/GlobalLoader';
import { ToastProvider } from './context/ToastContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { SocketProvider } from './context/SocketContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const CompaniesManagement = lazy(() => import('./pages/CompaniesManagement').then(m => ({ default: m.CompaniesManagement })));
const EmployeesManagement = lazy(() => import('./pages/EmployeesManagement').then(m => ({ default: m.EmployeesManagement })));
const FormsManagement = lazy(() => import('./pages/FormsManagement').then(m => ({ default: m.FormsManagement })));
const FormCreateEdit = lazy(() => import('./pages/FormCreateEdit').then(m => ({ default: m.FormCreateEdit })));
const FormDetail = lazy(() => import('./pages/FormDetail').then(m => ({ default: m.FormDetail })));
const ReportsView = lazy(() => import('./pages/ReportsView').then(m => ({ default: m.ReportsView })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const RolePermissions = lazy(() => import('./pages/RolePermissions').then(m => ({ default: m.RolePermissions })));
const AppPermissions = lazy(() => import('./pages/AppPermissions').then(m => ({ default: m.AppPermissions })));

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole) {
    const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
    const isAdmin = roleName === 'ADMIN';
    const isManager = roleName === 'MANAGER' || isAdmin;
    
    if (requiredRole === 'MANAGER' && !isManager) return <Navigate to="/forms" replace />;
    if (requiredRole === 'ADMIN' && !isAdmin) return <Navigate to="/forms" replace />;
  }
  
  return children;
};

export const App = () => {
  return (
    <ToastProvider>
      <ConnectivityProvider>
        <AppErrorBoundary>
          <SocketProvider>
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/forms" replace />} />

                  <Route path="forms">
                    <Route index element={<FormsManagement />} />
                    <Route path="new" element={<FormCreateEdit />} />
                    <Route path=":id" element={<FormDetail />} />
                    <Route path=":id/edit" element={<FormCreateEdit />} />
                  </Route>

                  <Route path="profile" element={<Profile />} />

                  <Route
                    path="reports"
                    element={<ProtectedRoute requiredRole="MANAGER"><ReportsView /></ProtectedRoute>}
                  />
                  <Route
                    path="companies"
                    element={<ProtectedRoute requiredRole="ADMIN"><CompaniesManagement /></ProtectedRoute>}
                  />
                  <Route
                    path="users"
                    element={<ProtectedRoute requiredRole="ADMIN"><EmployeesManagement /></ProtectedRoute>}
                  />
                  <Route
                    path="roles"
                    element={<ProtectedRoute requiredRole="ADMIN"><RolePermissions /></ProtectedRoute>}
                  />
                  <Route
                    path="app-permissions"
                    element={<ProtectedRoute requiredRole="ADMIN"><AppPermissions /></ProtectedRoute>}
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </AppErrorBoundary>
      </ConnectivityProvider>
    </ToastProvider>
  );
};
