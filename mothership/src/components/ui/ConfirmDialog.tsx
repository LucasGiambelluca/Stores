import { type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      icon: 'text-danger-600',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      icon: 'text-warning-600',
    },
  };

  const colorSet = colors[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`${colorSet.bg} px-6 py-4 flex items-center justify-between border-b border-${variant}-200`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white ${colorSet.icon}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className={`text-lg font-bold ${colorSet.text}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X size={20} className={colorSet.text} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="text-gray-700 leading-relaxed">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              ${variant === 'danger' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-warning-600 hover:bg-warning-700'}
              text-white
            `}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
