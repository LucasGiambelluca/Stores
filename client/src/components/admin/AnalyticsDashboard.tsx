import React, { useEffect, useState } from 'react';
import { TrendingUp, Award, Lock } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { getStoreHeaders } from '@/src/utils/storeDetection';
import { API_BASE } from '../../context/storeApi';
import { UpgradeModal } from './UpgradeModal';

interface AnalyticsData {
  averageTicket: number;
  totalOrders: number;
  bestSellers: {
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
}

export const AnalyticsDashboard: React.FC = () => {
  const { config } = useStoreConfig();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = config.plan === 'pro' || config.plan === 'enterprise';

  useEffect(() => {
    if (!isPro) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const storeHeaders = getStoreHeaders();
        const response = await fetch(`${API_BASE}/admin/analytics/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...storeHeaders
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden border border-gray-100">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-lime-100 p-4 rounded-full mb-4">
            <Lock size={32} className="text-lime-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Analíticas Pro</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Desbloqueá métricas avanzadas como Ticket Promedio y Productos Más Vendidos para tomar mejores decisiones.
          </p>
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Ver planes Pro
          </button>
        </div>
        
        {/* Blurred Content Preview */}
        <div className="opacity-50 filter blur-sm pointer-events-none select-none">
          <h2 className="text-lg font-semibold mb-4">Métricas Avanzadas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-32 bg-gray-300 rounded"></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>

        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={config.plan || 'free'}
          limitType="products" // Just generic upgrade
        />
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-xl"></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Average Ticket */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Ticket Promedio</h3>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data?.averageTicket || 0)}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            Basado en {data?.totalOrders || 0} órdenes pagadas
          </p>
        </div>
      </div>

      {/* Best Sellers */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
              <Award size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Más Vendidos</h3>
          </div>
        </div>
        <div className="space-y-3">
          {data?.bestSellers.map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {product.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{product.totalSold} u.</span>
                <span className="text-xs text-gray-500 block">
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(product.revenue)}
                </span>
              </div>
            </div>
          ))}
          {(!data?.bestSellers || data.bestSellers.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No hay datos suficientes</p>
          )}
        </div>
      </div>
    </div>
  );
};
