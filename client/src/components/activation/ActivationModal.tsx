import { useState } from 'react';
import axios from 'axios';

interface ActivationModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

interface LicenseInfo {
  serial: string;
  plan: string;
  expiresAt: string | null;
  maxProducts: number | null;
  maxOrders: number | null;
}

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function formatDate(date: string | null): string {
  if (!date) return 'Nunca (De por vida)';
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ActivationModal({ isOpen, onSuccess, onClose }: ActivationModalProps) {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Get storeId from session or URL
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = sessionStorage.getItem('tiendita_store_id') || urlParams.get('storeId');

      // Use relative URL for Vite proxy
      const response = await axios.post('/api/license/activate', {
        serial: serial.toUpperCase().trim(),
        storeId: storeId
      });
      
      if (response.data.success) {
        setSuccess(true);
        setLicenseInfo(response.data.license);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al activar la licencia');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onSuccess();
    window.location.reload(); // Reload to apply license
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {success && licenseInfo ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">¡Licencia Activada!</h2>
            <p className="text-gray-600 mb-4">
              Tu tienda ha sido activada exitosamente.
            </p>
            
            {/* License Details */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 text-left mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-center">📋 Detalles de tu Licencia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold text-purple-700">
                    {PLAN_NAMES[licenseInfo.plan] || licenseInfo.plan.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Válida hasta:</span>
                  <span className="font-semibold">
                    {formatDate(licenseInfo.expiresAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos permitidos:</span>
                  <span className="font-semibold">
                    {licenseInfo.maxProducts === -1 ? 'Ilimitados' : licenseInfo.maxProducts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Órdenes/mes:</span>
                  <span className="font-semibold">
                    {licenseInfo.maxOrders === -1 ? 'Ilimitadas' : licenseInfo.maxOrders}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Continuar a mi tienda
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔑</div>
              <h2 className="text-2xl font-bold mb-2">Activar Licencia</h2>
              <p className="text-gray-600">
                Ingresá el serial que recibiste por email
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial de Licencia
                </label>
                <input
                  type="text"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="TND-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
                  required
                  disabled={loading}
                  maxLength={19}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: TND-XXXX-XXXX-XXXX
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !serial}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Activando...' : 'Activar Licencia'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

