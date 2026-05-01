/**
 * ConfirmDialog Component
 * 
 * Reusable confirmation dialog for destructive actions.
 * Supports warning and danger variants with customizable messages.
 * 
 * @module components/ui/ConfirmDialog
 */

import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' or 'warning'
  isLoading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
    >
      {/* Message */}
      <div className="p-6">
        <p className="text-base text-gray-700 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Button Group */}
      <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium text-white
            min-h-[44px] transition-colors
            ${variant === 'danger' 
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
              : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${variant === 'danger' ? 'focus:ring-red-500' : 'focus:ring-orange-500'}
          `}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
