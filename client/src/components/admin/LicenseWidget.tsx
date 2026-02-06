import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Package, ShoppingCart, Crown, Zap } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreContext';
import { ActivateLicenseModal } from './ActivateLicenseModal';

interface LicenseInfo {
  activated: boolean;
  license?: {
    serial: string;
    plan: string;
    status: string;
    expiresAt: string | null;
    maxProducts: number | null;
    maxOrders: number | null;
  };
}

const planLabels: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  trial: { name: 'Trial', icon: <Clock size={16} />, color: '#f59e0b' },
  free: { name: 'Free', icon: <Shield size={16} />, color: '#6b7280' },
  starter: { name: 'Starter', icon: <Zap size={16} />, color: '#3b82f6' },
  pro: { name: 'Pro', icon: <Crown size={16} />, color: '#8b5cf6' },
  enterprise: { name: 'Enterprise', icon: <Crown size={16} />, color: '#10b981' },
};

export const LicenseWidget: React.FC = () => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const { config } = useStoreConfig();

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const storeId = sessionStorage.getItem('tiendita_store_id');
      const response = await fetch('/api/license/status', {
        headers: {
          'x-store-id': storeId || ''
        }
      });
      const data = await response.json();
      setLicenseInfo(data);
    } catch (error) {
      console.error('Error fetching license status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatExpirationDate = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    return date.toLocaleDateString('es-AR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-4 animate-pulse" style={{ minHeight: '80px' }}>
        <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-16"></div>
      </div>
    );
  }

  if (!licenseInfo?.activated) {
    return (
      <div 
        className="rounded-xl p-4 border"
        style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderColor: 'rgba(239, 68, 68, 0.3)' 
        }}
      >
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">Sin Licencia</span>
        </div>
        <p className="text-xs text-red-400/70 mb-3">
          Activa una licencia para usar todas las funciones
        </p>
        <button
          onClick={() => setIsActivateModalOpen(true)}
          className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors"
        >
          Activar Licencia
        </button>

        <ActivateLicenseModal 
          isOpen={isActivateModalOpen}
          onClose={() => setIsActivateModalOpen(false)}
          onSuccess={fetchLicenseStatus}
        />
      </div>
    );
  }

  const { license } = licenseInfo;
  if (!license) return null;

  const planInfo = planLabels[license.plan] || planLabels.free;
  const daysRemaining = getDaysRemaining(license.expiresAt);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  return (
    <div 
      className="rounded-xl p-4 border transition-all"
      style={{ 
        backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
        borderColor: isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)' 
      }}
    >
      {/* Plan Badge */}
      <div className="flex items-center justify-between mb-3">
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
          style={{ 
            backgroundColor: `${planInfo.color}20`, 
            color: planInfo.color 
          }}
        >
          {planInfo.icon}
          <span>{planInfo.name}</span>
        </div>
        {license.status === 'activated' && !isExpired && (
          <CheckCircle size={16} className="text-green-400" />
        )}
        {isExpired && (
          <AlertTriangle size={16} className="text-red-400" />
        )}
      </div>

      {/* Expiration */}
      {license.expiresAt ? (
        <div className={`text-xs mb-2 ${isExpiringSoon ? 'text-amber-400' : 'text-white/60'}`}>
          {isExpired ? (
            <span className="text-red-400">⚠️ Licencia expirada</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span>
                <Clock size={12} className="inline mr-1" />
                {daysRemaining} días restantes
              </span>
              <span className="text-[10px] text-white/40">
                Vence: {formatExpirationDate(license.expiresAt)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs mb-2 text-emerald-400 flex items-center gap-1">
          <span>∞</span>
          <span>Licencia de por vida</span>
        </div>
      )}

      {/* Limits */}
      <div className="flex gap-4 text-xs text-white/50">
        <div className="flex items-center gap-1">
          <Package size={12} />
          <span>{license.maxProducts ?? '∞'} productos</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingCart size={12} />
          <span>{license.maxOrders ?? '∞'} órdenes</span>
        </div>
      </div>

      {/* Serial (truncated) */}
      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
        <span className="text-[10px] text-white/30 font-mono">
          {license.serial}
        </span>
        {/* Allow re-activation/upgrade */}
        <button
          onClick={() => setIsActivateModalOpen(true)}
          className="text-[10px] text-blue-400 hover:text-blue-300"
        >
          Cambiar
        </button>
      </div>

      <ActivateLicenseModal 
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onSuccess={fetchLicenseStatus}
      />
    </div>
  );
};
