/**
 * Toggle Component
 * 
 * Accessible toggle switch for binary on/off states.
 * Follows WCAG accessibility guidelines with proper ARIA attributes.
 * 
 * @module components/ui/Toggle
 */

/**
 * @param {Object} props
 * @param {boolean} props.enabled - Current toggle state
 * @param {function} props.onChange - Callback when toggle state changes
 * @param {boolean} [props.disabled=false] - Whether toggle is disabled
 * @param {string} [props.size='md'] - Size variant ('sm' | 'md' | 'lg')
 * @param {string} [props.label] - Optional label text for accessibility
 */
export default function Toggle({ 
  enabled, 
  onChange, 
  disabled = false, 
  size = 'md',
  label = 'Toggle' 
}) {
  // Size variants
  const sizes = {
    sm: {
      container: 'h-5 w-9',
      knob: 'h-3 w-3',
      translate: enabled ? 'translate-x-5' : 'translate-x-1'
    },
    md: {
      container: 'h-6 w-11',
      knob: 'h-4 w-4',
      translate: enabled ? 'translate-x-6' : 'translate-x-1'
    },
    lg: {
      container: 'h-7 w-14',
      knob: 'h-5 w-5',
      translate: enabled ? 'translate-x-8' : 'translate-x-1'
    }
  };

  const sizeClasses = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`
        relative inline-flex ${sizeClasses.container} items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:bg-opacity-90'
        }
      `}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`
          ${sizeClasses.knob}
          inline-block transform rounded-full bg-white shadow-sm
          transition-transform duration-200 ease-in-out
          ${sizeClasses.translate}
        `}
      />
    </button>
  );
}
