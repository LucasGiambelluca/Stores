import { useState } from 'react';
import type { Store } from '../../api/stores';
import { Copy, CheckCircle, MoreVertical, ExternalLink, Ban, RefreshCw, Trash2, Store as StoreIcon } from 'lucide-react';
import { useSuspendStore, useReactivateStore, useDeleteStore } from '../../hooks/useStores';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';

// Local formatDate helper
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface StoresTableProps {
  stores: Store[];
}

export default function StoresTable({ stores }: StoresTableProps) {
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'suspend' | 'delete' | null;
    store: Store | null;
  }>({ isOpen: false, action: null, store: null });

  const suspendMutation = useSuspendStore();
  const reactivateMutation = useReactivateStore();
  const deleteMutation = useDeleteStore();

  const copySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      pending: 'default',
      active: 'success',
      suspended: 'warning',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      active: 'Activa',
      suspended: 'Suspendida',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      starter: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-emerald-100 text-emerald-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  const handleAction = (action: string, store: Store) => {
    setOpenDropdown(null);

    switch (action) {
      case 'suspend':
      case 'delete':
        setConfirmDialog({ isOpen: true, action, store });
        break;
      case 'reactivate':
        reactivateMutation.mutate(store.id);
        break;
    }
  };

  const executeConfirmedAction = () => {
    if (!confirmDialog.store) return;

    const { action, store } = confirmDialog;
    
    switch (action) {
      case 'suspend':
        suspendMutation.mutate(store.id);
        break;
      case 'delete':
        deleteMutation.mutate(store.id);
        break;
    }
    
    setConfirmDialog({ isOpen: false, action: null, store: null });
  };

  if (stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <StoreIcon size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay tiendas registradas</h3>
        <p className="text-gray-500">
          Haz clic en "Nueva Tienda" para crear tu primera tienda.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-50 to-secondary-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tienda
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <StoreIcon size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.ownerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPlanColor(store.plan)}`}>
                      {store.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(store.status)}>
                      {getStatusLabel(store.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.licenseKey ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {store.licenseKey}
                        </code>
                        <button
                          onClick={() => copySerial(store.licenseKey!)}
                          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Copiar serial"
                        >
                          {copiedSerial === store.licenseKey ? (
                            <CheckCircle size={16} className="text-success-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin licencia</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(store.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === store.id ? null : store.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {openDropdown === store.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                            {store.domain && (
                              <a
                                href={
                                  window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
                                    ? `http://localhost:3005?storeId=${store.id}`
                                    : `https://${store.domain}.tiendita.app`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                              >
                                <ExternalLink size={16} />
                                Ver tienda
                              </a>
                            )}
                            
                            {store.status === 'active' && (
                              <button
                                onClick={() => handleAction('suspend', store)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-warning-50 flex items-center gap-3 text-gray-700 hover:text-warning-700 transition-colors"
                              >
                                <Ban size={16} />
                                Suspender
                              </button>
                            )}
                            
                            {store.status === 'suspended' && (
                              <button
                                onClick={() => handleAction('reactivate', store)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-success-50 flex items-center gap-3 text-gray-700 hover:text-success-700 transition-colors"
                              >
                                <RefreshCw size={16} />
                                Reactivar
                              </button>
                            )}
                            
                            {store.domain !== 'mothership' && (
                              <button
                                onClick={() => handleAction('delete', store)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-danger-50 flex items-center gap-3 text-danger-600 hover:text-danger-700 transition-colors border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, store: null })}
        onConfirm={executeConfirmedAction}
        title={
          confirmDialog.action === 'delete'
            ? 'Eliminar Tienda'
            : 'Suspender Tienda'
        }
        message={
          confirmDialog.action === 'delete'
            ? `¿Estás seguro de eliminar la tienda "${confirmDialog.store?.name}"? Esta acción no se puede deshacer.`
            : `¿Suspender la tienda "${confirmDialog.store?.name}"? Los usuarios no podrán acceder.`
        }
        confirmText={
          confirmDialog.action === 'delete'
            ? 'Eliminar'
            : 'Suspender'
        }
        variant={confirmDialog.action === 'suspend' ? 'warning' : 'danger'}
        isLoading={suspendMutation.isPending || deleteMutation.isPending}
      />
    </>
  );
}
