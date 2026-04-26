import { Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';
import { GlobalLoader } from './components/UI/GlobalLoader';
import { ToastProvider } from './context/ToastContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { SocketProvider } from './context/SocketContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { hasPermission } from './utils/permissionUtils';
import { AccessDenied } from './components/UI/AccessDenied';

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

const ProtectedRoute = ({ children, requiredView, requiredAction = 'View' }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <GlobalLoader />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredView) {
    const hasAccess = hasPermission(user, requiredView, requiredAction);
    if (!hasAccess) {
      return <AccessDenied module={requiredView} />;
    }
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
                    <Route index element={<ProtectedRoute requiredView="Forms"><FormsManagement /></ProtectedRoute>} />
                    <Route path="new" element={<ProtectedRoute requiredView="Forms"><FormCreateEdit /></ProtectedRoute>} />
                    <Route path=":id" element={<ProtectedRoute requiredView="Forms"><FormDetail /></ProtectedRoute>} />
                    <Route path=":id/edit" element={<ProtectedRoute requiredView="Forms"><FormCreateEdit /></ProtectedRoute>} />
                  </Route>

                  <Route path="profile" element={<Profile />} />

                  <Route
                    path="reports"
                    element={<ProtectedRoute requiredView="Reports"><ReportsView /></ProtectedRoute>}
                  />
                  <Route
                    path="companies"
                    element={<ProtectedRoute requiredView="Companies"><CompaniesManagement /></ProtectedRoute>}
                  />
                  <Route
                    path="users"
                    element={<ProtectedRoute requiredView="Users"><EmployeesManagement /></ProtectedRoute>}
                  />
                  <Route
                    path="roles"
                    element={<ProtectedRoute requiredView="Roles"><RolePermissions /></ProtectedRoute>}
                  />
                  <Route
                    path="app-permissions"
                    element={<ProtectedRoute requiredView="Roles"><AppPermissions /></ProtectedRoute>}
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
