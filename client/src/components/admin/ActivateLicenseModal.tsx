import React, { useState } from 'react';
import { Key, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ActivateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActivateLicenseModal: React.FC<ActivateLicenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [serial, setSerial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic format validation (TND-XXXX-XXXX-XXXX)
    if (!serial.match(/^TND-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      setError('El formato del serial es inválido. Debe ser TND-XXXX-XXXX-XXXX');
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serial })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al activar licencia');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format serial input automatically
  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add dashes
    if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
    if (value.length > 8) value = value.slice(0, 8) + '-' + value.slice(8);
    if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13);
    
    // Limit length
    if (value.length > 19) value = value.slice(0, 19);
    
    setSerial(value);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Key size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activar Licencia</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Ingresa tu código de licencia para desbloquear todas las funciones.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-green-800 dark:text-green-200 mb-1">¡Licencia Activada!</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Tu tienda ha sido actualizada correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Serial Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={serial}
                  onChange={handleSerialChange}
                  required
                  placeholder="TND-XXXX-XXXX-XXXX"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono uppercase"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                Formato: TND-XXXX-XXXX-XXXX
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || serial.length !== 19}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Verificando...' : 'Activar Licencia'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
