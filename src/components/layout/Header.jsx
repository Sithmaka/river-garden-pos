/**
 * Header Component
 * 
 * Top navigation bar displaying app title, user information, and logout button.
 * Styled according to user role (admin/cashier theme colors).
 * 
 * @module components/layout/Header
 */

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

export default function Header() {
  const { user, role, signOut } = useAuth();
  const { isAdmin, isCashier } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePrinterSettings = () => {
    if (role === 'cashier') {
      navigate('/cashier/printer-settings');
    }
  };

  // Determine theme-based styles
  const headerBg = isAdmin ? 'bg-admin-primary' : 'bg-cashier-primary';
  const badgeBg = isAdmin ? 'bg-white/20' : 'bg-white/20';

  return (
    <header className={`${headerBg} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* App Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold">
              River Garden POS
            </h1>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            {/* User Email - Hidden on mobile */}
            <div className="hidden sm:block text-sm">
              {user?.email}
            </div>

            {/* Role Badge */}
            <span 
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeBg} text-white`}
              data-testid="header-role-badge"
            >
              {role?.toUpperCase()}
            </span>

            {/* Printer Settings Button - Only for Cashier */}
            {role === 'cashier' && (
              <button
                onClick={handlePrinterSettings}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="View Printer Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="danger"
              className="text-sm"
              data-testid="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
