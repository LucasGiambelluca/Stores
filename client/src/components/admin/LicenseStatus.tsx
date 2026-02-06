import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Infinity } from 'lucide-react';

interface LicenseData {
  license: {
    serial: string;
    plan: string;
    status: string;
    expiresAt: string;
    maxProducts: number | null;
    maxOrders: number | null;
  };
  usage: {
    products: {
      current: number;
      max: number | null;
      percentage: number | null;
    };
    orders: {
      current: number;
      max: number | null;
      percentage: number | null;
    };
  };
}

export default function LicenseStatus() {
  const [data, setData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLicenseData();
  }, []);

  const fetchLicenseData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // Use relative URL for Vite proxy
      const response = await axios.get('/api/license/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (err) {
      setError('No se pudo cargar la información de la licencia');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-yellow-600" size={20} />
          <p className="text-yellow-800 text-sm">{error || 'Sin licencia activa'}</p>
        </div>
      </div>
    );
  }

  const { license, usage } = data;

  // Calculate days remaining
  const expiresDate = new Date(license.expiresAt);
  const today = new Date();
  const daysRemaining = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 30;
  const isExpired = daysRemaining <= 0;

  // Progress bar color logic
  const getProgressColor = (percentage: number | null) => {
    if (percentage === null) return 'bg-blue-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Plan {license.plan.toUpperCase()}</h3>
            <p className="text-sm opacity-90">Serial: {license.serial}</p>
          </div>
          <div className="text-right">
            {isExpired ? (
              <div className="flex items-center gap-2 text-red-200">
                <AlertTriangle size={24} />
                <span className="font-bold">VENCIDA</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle size={24} />
                <span className="font-bold">ACTIVA</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      {isExpiringSoon && !isExpired && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-600" size={20} />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Tu licencia vence en {daysRemaining} días
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Renueva pronto para evitar interrupciones
              </p>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <div>
              <p className="text-sm font-medium text-red-800">
                Tu licencia ha expirado
              </p>
              <p className="text-xs text-red-600 mt-1">
                Renueva ahora para restaurar el acceso completo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* License Details */}
      <div className="p-6 space-y-6">
        {/* Expiration Date */}
        <div className="flex items-center justify-between pb-4 border-b">
          <span className="text-sm text-gray-600">Válida hasta:</span>
          <span className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
            {expiresDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Products Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Productos</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.products.current} / {usage.products.max === null ? '∞' : usage.products.max}
            </span>
          </div>
          {usage.products.max !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(usage.products.percentage)}`}
                style={{ width: `${Math.min(usage.products.percentage || 0, 100)}%` }}
              ></div>
            </div>
          )}
          {usage.products.percentage !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {usage.products.percentage}% utilizado
            </p>
          )}
        </div>

        {/* Orders Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pedidos (este mes)</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.orders.current} / {usage.orders.max === null ? '∞' : usage.orders.max}
            </span>
          </div>
          {usage.orders.max !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(usage.orders.percentage)}`}
                style={{ width: `${Math.min(usage.orders.percentage || 0, 100)}%` }}
              ></div>
            </div>
          )}
          {usage.orders.percentage !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {usage.orders.percentage}% utilizado
            </p>
          )}
        </div>

        {/* Upgrade CTA */}
        {(usage.products.percentage && usage.products.percentage >= 80) ||
         (usage.orders.percentage && usage.orders.percentage >= 80) ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">
              ¿Necesitas más capacidad?
            </p>
            <p className="text-xs text-blue-700 mb-3">
              Actualiza tu plan para disfrutar de límites más altos
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition">
              Ver Planes
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
