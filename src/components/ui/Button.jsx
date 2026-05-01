/**
 * Themed Button Component
 * 
 * Reusable button with automatic theme-based styling.
 * Supports multiple variants (primary, secondary, danger).
 * 
 * @module components/ui/Button
 */

import { useTheme } from '../../contexts/ThemeContext';

/**
 * Button component with theme-aware styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'danger'} props.variant - Button style variant
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {'button'|'submit'|'reset'} props.type - Button type
 * @param {string} props.className - Additional CSS classes
 */
export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const { theme } = useTheme();

  // Base classes for all buttons
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Get variant-specific classes based on theme
  const getVariantClasses = () => {
    if (theme === 'admin') {
      switch (variant) {
        case 'primary':
          return 'bg-admin-primary hover:bg-admin-primary-hover text-white focus:ring-admin-primary';
        case 'secondary':
          return 'bg-admin-secondary hover:bg-blue-600 text-white focus:ring-admin-secondary';
        case 'danger':
          return 'bg-admin-danger hover:bg-red-600 text-white focus:ring-admin-danger';
        default:
          return 'bg-admin-primary hover:bg-admin-primary-hover text-white focus:ring-admin-primary';
      }
    } else if (theme === 'cashier') {
      switch (variant) {
        case 'primary':
          return 'bg-cashier-primary hover:bg-cashier-primary-hover text-white focus:ring-cashier-primary';
        case 'secondary':
          return 'bg-cashier-secondary hover:bg-green-600 text-white focus:ring-cashier-secondary';
        case 'danger':
          return 'bg-cashier-danger hover:bg-red-600 text-white focus:ring-cashier-danger';
        default:
          return 'bg-cashier-primary hover:bg-cashier-primary-hover text-white focus:ring-cashier-primary';
      }
    } else {
      // Default theme (neutral)
      switch (variant) {
        case 'primary':
          return 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-600';
        case 'secondary':
          return 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-600';
        case 'danger':
          return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600';
        default:
          return 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-600';
      }
    }
  };

  const buttonClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
}
