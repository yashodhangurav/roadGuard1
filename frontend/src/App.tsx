import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReportsProvider } from './context/ReportsContext';
import { PageLayout } from './components/layout/PageLayout';
import { Home } from './pages/Home';
import { Detection } from './pages/Detection';
import { Mapping } from './pages/Mapping';
import { Analysis } from './pages/Analysis';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { AIAssistant } from './pages/AIAssistant';
import { About } from './pages/About';
import { CitizenLogin } from './pages/CitizenLogin';
import { CitizenSignup } from './pages/CitizenSignup';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminPortal } from './pages/admin/AdminPortal';
import { getStoredAdminUser } from './services/adminService';
import { AdminUser } from './data/adminDemoData';

const AdminRouteWrapper: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminUser());
  const navigate = useNavigate();

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminPortal
      adminUser={adminUser}
      onLogout={() => {
        setAdminUser(null);
        navigate('/admin/login');
      }}
      onBackToHome={() => {
        navigate('/');
      }}
    />
  );
};

const AdminLoginWrapper: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminUser());
  const navigate = useNavigate();

  if (adminUser) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminLogin
      onLoginSuccess={(user) => {
        setAdminUser(user);
        navigate('/admin/dashboard');
      }}
      onBackToHome={() => navigate('/')}
    />
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportsProvider>
          <Routes>
            {/* Public Multi-Page Routes Wrapped with PageLayout */}
            <Route
              path="/"
              element={
                <PageLayout>
                  <Home />
                </PageLayout>
              }
            />
            <Route
              path="/detection"
              element={
                <PageLayout>
                  <Detection />
                </PageLayout>
              }
            />
            <Route
              path="/mapping"
              element={
                <PageLayout>
                  <Mapping />
                </PageLayout>
              }
            />
            <Route
              path="/analysis"
              element={
                <PageLayout>
                  <Analysis />
                </PageLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <PageLayout>
                  <Reports />
                </PageLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <PageLayout>
                  <Analytics />
                </PageLayout>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <PageLayout>
                  <AIAssistant />
                </PageLayout>
              }
            />
            <Route
              path="/about"
              element={
                <PageLayout>
                  <About />
                </PageLayout>
              }
            />
            <Route
              path="/login"
              element={
                <PageLayout>
                  <CitizenLogin />
                </PageLayout>
              }
            />
            <Route
              path="/signup"
              element={
                <PageLayout>
                  <CitizenSignup />
                </PageLayout>
              }
            />

            {/* Citizen Dashboard Route */}
            <Route path="/dashboard" element={<CitizenDashboardPage />} />

            {/* Administrator Restricted Routes */}
            <Route path="/admin/login" element={<AdminLoginWrapper />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/*" element={<AdminRouteWrapper />} />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ReportsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
