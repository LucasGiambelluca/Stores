import React, { useEffect, useState } from 'react';
import { HardDrive, TrendingUp, AlertCircle, Database, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { getStoreHeaders } from '@/src/utils/storeDetection';
import { API_BASE } from '../../context/storeApi';

interface LicenseUsage {
  productCount: number;
  maxProducts: number;
  orderCount: number;
  maxOrders: number;
  canCreateProduct: boolean;
  canCreateOrder: boolean;
  productPercentage: number;
  orderPercentage: number;
}

interface LicenseUsageWidgetProps {
  compact?: boolean;
}

export default function LicenseUsageWidget({ compact = false }: LicenseUsageWidgetProps) {
  const [usage, setUsage] = useState<LicenseUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE}/license/usage`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Sin licencia activa');
          } else {
            setError('Error al cargar uso');
          }
          return;
        }
        
        const data = await response.json();
        setUsage(data.usage);
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">{error || 'Sin datos de uso'}</span>
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number, canCreate: boolean) => {
    if (!canCreate) return 'bg-red-500';
    if (percentage >= 90) return 'bg-amber-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-500" />
          <span className="font-medium">{usage.productCount}/{usage.maxProducts}</span>
          <span className="text-gray-500">productos</span>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-gray-500" />
          <span className="font-medium">{usage.orderCount}/{usage.maxOrders}</span>
          <span className="text-gray-500">órdenes/mes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Uso de Licencia
      </h3>
      
      <div className="space-y-4">
        {/* Products Usage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Productos</span>
            </div>
            <span className="text-sm font-semibold">
              {usage.productCount} / {usage.maxProducts}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(usage.productPercentage, usage.canCreateProduct)}`}
              style={{ width: `${usage.productPercentage}%` }}
            />
          </div>
          {!usage.canCreateProduct && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              Límite alcanzado - Actualiza tu plan
            </p>
          )}
        </div>

        {/* Orders Usage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Órdenes este mes</span>
            </div>
            <span className="text-sm font-semibold">
              {usage.orderCount} / {usage.maxOrders}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(usage.orderPercentage, usage.canCreateOrder)}`}
              style={{ width: `${usage.orderPercentage}%` }}
            />
          </div>
          {!usage.canCreateOrder && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              Límite alcanzado - Actualiza tu plan
            </p>
          )}
        </div>
      </div>

      {(usage.productPercentage >= 90 || usage.orderPercentage >= 90) && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ Estás cerca de alcanzar los límites de tu plan. 
            Contacta a soporte para actualizar.
          </p>
        </div>
      )}
    </div>
  );
}
