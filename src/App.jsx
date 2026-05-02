import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { registerServiceWorker, checkPWAInstallPrompt } from './serviceWorker';
import { startOfflineSyncWatcher } from "./services/syncService";

import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import UpdateNotification from './components/ui/UpdateNotification';
import SplashScreen from './components/ui/SplashScreen';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPassword from './pages/ResetPassword';

import UserManagementPage from './pages/UserManagementPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import Settings from './pages/Settings';
import OrderHistory from './pages/OrderHistory';
import PrinterDiagnostics from './pages/PrinterDiagnostics';
import OrdersAnalysis from "./pages/OrdersAnalysis";

import CashierDashboard from './pages/CashierDashboard';
import CashierOrderEntry from './pages/CashierOrderEntry';
import PrinterSettingsView from './pages/PrinterSettingsView';

import WaiterOrderEntry from './pages/WaiterOrderEntry';

import './App.css';

/* =========================================================
   ROLE REDIRECT
========================================================= */

function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'cashier') return <Navigate to="/cashier/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

/* =========================================================
   404 REDIRECT
========================================================= */

function NotFoundRedirect() {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'cashier') return <Navigate to="/cashier/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // ✅ PWA INIT
    registerServiceWorker();
    checkPWAInstallPrompt();

    // ✅ OFFLINE SYNC INIT
    const stopSync = startOfflineSyncWatcher({
      onSynced: (result) => {
        console.log("✅ Offline orders synced:", result);
      }
    });

    console.log('✅ [App] PWA + Offline Sync initialized');

    return () => {
      stopSync && stopSync();
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <UpdateNotification />

      {/* ✅ Offline Banner */}
      {!navigator.onLine && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm">
          ⚠ Offline Mode: Orders & Printing Available
        </div>
      )}

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>

          {/* ================= PUBLIC ================= */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ================= */}

          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><AdminDashboard /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/menu"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><AdminMenu /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><Settings /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><UserManagementPage /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><OrderHistory role="admin" /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/orders-analysis"
            element={
              <RoleRoute allowedRole="admin">
                <Layout><OrdersAnalysis /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/printer-diagnostics"
            element={
              <RoleRoute allowedRole="admin">
                <PrinterDiagnostics />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/register"
            element={
              <RoleRoute allowedRole="admin">
                <RegisterPage />
              </RoleRoute>
            }
          />

          {/* ================= CASHIER ================= */}

          <Route
            path="/cashier/dashboard"
            element={
              <RoleRoute allowedRole="cashier">
                <Layout><CashierDashboard /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/cashier/order"
            element={
              <RoleRoute allowedRole="cashier">
                <SimpleLayout><CashierOrderEntry /></SimpleLayout>
              </RoleRoute>
            }
          />

          <Route
            path="/cashier/orders"
            element={
              <RoleRoute allowedRole="cashier">
                <Layout><OrderHistory role="cashier" /></Layout>
              </RoleRoute>
            }
          />

          <Route
            path="/cashier/printer-settings"
            element={
              <RoleRoute allowedRole="cashier">
                <Layout><PrinterSettingsView /></Layout>
              </RoleRoute>
            }
          />

          {/* ================= WAITER ================= */}

          <Route
            path="/waiter/order/:orderId"
            element={
              <RoleRoute allowedRole="cashier">
                <SimpleLayout><WaiterOrderEntry /></SimpleLayout>
              </RoleRoute>
            }
          />

          {/* ================= 404 ================= */}
          <Route path="*" element={<NotFoundRedirect />} />

        </Routes>
      </BrowserRouter>
    </>
  );
}

/* =========================================================
   REUSABLE LAYOUTS (Cleaner Code)
========================================================= */

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function SimpleLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default App;