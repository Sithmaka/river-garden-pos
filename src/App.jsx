import WaiterOrderEntry from './pages/WaiterOrderEntry';
{/* Waiter Routes */ }
<Route
  path="/waiter/order/:orderId"
  element={
    <RoleRoute allowedRole="cashier">
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <WaiterOrderEntry />
        </div>
        <Footer />
      </div>
    </RoleRoute>
  }
/>
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { registerServiceWorker, checkPWAInstallPrompt } from './serviceWorker';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import UpdateNotification from './components/ui/UpdateNotification';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import Settings from './pages/Settings';
import CashierDashboard from './pages/CashierDashboard';
import CashierOrderEntry from './pages/CashierOrderEntry';
import OrderHistory from './pages/OrderHistory';
import PrinterSettingsView from './pages/PrinterSettingsView';
import PrinterDiagnostics from './pages/PrinterDiagnostics';
import SplashScreen from './components/ui/SplashScreen';
import ResetPassword from './pages/ResetPassword';
import './App.css';

/**
 * RoleBasedRedirect Component
 * Redirects users to their role-appropriate dashboard
 */
function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (role === 'cashier') {
    return <Navigate to="/cashier/dashboard" replace />;
  } else {
    // Unknown role, redirect to login
    return <Navigate to="/login" replace />;
  }
}

/**
 * NotFoundRedirect Component
 * Handles 404 routes by redirecting to appropriate location based on auth state
 */
function NotFoundRedirect() {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users to their dashboard
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (role === 'cashier') {
    return <Navigate to="/cashier/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Initialize PWA on mount
  useEffect(() => {
    registerServiceWorker();
    checkPWAInstallPrompt();
    console.log('✅ [App] PWA initialization complete');
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <UpdateNotification />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Root Route - Redirect to role-based dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRole="admin">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <UserManagementPage />
                </div>
                <Footer />
              </div>
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

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRole="admin">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <AdminDashboard />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <RoleRoute allowedRole="admin">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <AdminMenu />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRole="admin">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <Settings />
                </div>
                <Footer />
              </div>
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
          path="/admin/orders"
          element={
            <RoleRoute allowedRole="admin">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <OrderHistory role="admin" />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        {/* Cashier Routes */}
        <Route
          path="/cashier/dashboard"
          element={
            <RoleRoute allowedRole="cashier">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <CashierDashboard />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        <Route
          path="/cashier/order"
          element={
            <RoleRoute allowedRole="cashier">
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <CashierOrderEntry />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        <Route
          path="/cashier/orders"
          element={
            <RoleRoute allowedRole="cashier">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <OrderHistory role="cashier" />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        <Route
          path="/cashier/printer-settings"
          element={
            <RoleRoute allowedRole="cashier">
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <PrinterSettingsView />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        {/* Waiter Route for updating ongoing orders */}
        <Route
          path="/waiter/order/:orderId"
          element={
            <RoleRoute allowedRole="cashier">
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <WaiterOrderEntry />
                </div>
                <Footer />
              </div>
            </RoleRoute>
          }
        />

        {/* Catch-all Route - 404 Handler */}
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
