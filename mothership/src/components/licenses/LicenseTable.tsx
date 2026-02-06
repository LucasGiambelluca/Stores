import type { License } from '../../types/license';
import { formatDate } from '../../utils/formatters';
import { Copy, CheckCircle, MoreVertical, RefreshCw, Ban, XCircle, Trash2, Key } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesApi } from '../../api/licenses';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';

interface LicenseTableProps {
  licenses: License[];
}

export default function LicenseTable({ licenses }: LicenseTableProps) {
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'suspend' | 'revoke' | 'delete' | 'bulk-delete' | null;
    license: License | null;
  }>({ isOpen: false, action: null, license: null });
  
  const queryClient = useQueryClient();
  
  // Mutations for actions
  const suspendMutation = useMutation({
    mutationFn: (serial: string) => licensesApi.suspend(serial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      setConfirmDialog({ isOpen: false, action: null, license: null });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (serial: string) => licensesApi.reactivate(serial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (serial: string) => licensesApi.revoke(serial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      setConfirmDialog({ isOpen: false, action: null, license: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serial: string) => licensesApi.delete(serial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      setConfirmDialog({ isOpen: false, action: null, license: null });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (serials: string[]) => licensesApi.bulkDelete(serials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      setConfirmDialog({ isOpen: false, action: null, license: null });
      setSelectedSerials(new Set());
    },
  });
  
  const copySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  };
  
  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      generated: 'default',
      activated: 'success',
      suspended: 'warning',
      expired: 'danger',
      revoked: 'danger',
    };
    return variants[status] || 'default';
  };
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      generated: 'Generada',
      activated: 'Activa',
      suspended: 'Suspendida',
      expired: 'Vencida',
      revoked: 'Revocada',
    };
    return labels[status] || status;
  };

  const getPlanBadgeVariant = (plan: string): 'default' | 'secondary' => {
    return plan === 'free' ? 'default' : 'secondary';
  };

  const handleAction = (action: string, license: License) => {
    setOpenDropdown(null);

    switch (action) {
      case 'suspend':
      case 'revoke':
      case 'delete':
        setConfirmDialog({ isOpen: true, action, license });
        break;
      case 'reactivate':
        reactivateMutation.mutate(license.serial);
        break;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const deletableSerials = licenses
        .filter(l => l.status !== 'activated')
        .map(l => l.serial);
      setSelectedSerials(new Set(deletableSerials));
    } else {
      setSelectedSerials(new Set());
    }
  };

  const handleSelectOne = (serial: string, checked: boolean) => {
    const newSet = new Set(selectedSerials);
    if (checked) {
      newSet.add(serial);
    } else {
      newSet.delete(serial);
    }
    setSelectedSerials(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedSerials.size === 0) return;
    setConfirmDialog({ isOpen: true, action: 'bulk-delete', license: null });
  };

  const executeConfirmedAction = () => {
    if (confirmDialog.action === 'bulk-delete') {
      bulkDeleteMutation.mutate(Array.from(selectedSerials));
      return;
    }

    if (!confirmDialog.license) return;

    const { action, license } = confirmDialog;
    
    switch (action) {
      case 'suspend':
        suspendMutation.mutate(license.serial);
        break;
      case 'revoke':
        revokeMutation.mutate(license.serial);
        break;
      case 'delete':
        deleteMutation.mutate(license.serial);
        break;
    }
  };

  const deletableLicenses = licenses.filter(l => l.status !== 'activated');
  const allDeletableSelected = deletableLicenses.length > 0 && 
    deletableLicenses.every(l => selectedSerials.has(l.serial));
  
  if (licenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-slate-200 ">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Key size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No hay licencias creadas aún</h3>
        <p className="text-slate-500 ">
          Haz clic en "Nueva Licencia" para generar tu primera licencia.
        </p>
      </div>
    );
  }
  
  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedSerials.size > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-red-800 ">
            {selectedSerials.size} licencia(s) seleccionada(s)
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 size={16} />
            {bulkDeleteMutation.isPending ? 'Eliminando...' : 'Eliminar seleccionadas'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 ">
        <div className="">
          <table className="min-w-full divide-y divide-slate-200 ">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 ">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allDeletableSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    title="Seleccionar todas las eliminables"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Serial
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Expira
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 ">
              {licenses.map((license) => {
                const canDelete = license.status !== 'activated';
                const isSelected = selectedSerials.has(license.serial);
                
                return (
                  <tr key={license.serial} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-red-50 ' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(license.serial, e.target.checked)}
                        disabled={!canDelete}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-30"
                        title={canDelete ? 'Seleccionar' : 'No se puede eliminar licencias activas'}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-800 border border-slate-200 ">
                          {license.serial}
                        </code>
                        <button
                          onClick={() => copySerial(license.serial)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Copiar serial"
                        >
                          {copiedSerial === license.serial ? (
                            <CheckCircle size={18} className="text-green-600 " />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={getPlanBadgeVariant(license.plan)}>
                        {license.plan.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(license.status)}>
                        {getStatusLabel(license.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900 ">{license.ownerName || '-'}</div>
                      <div className="text-sm text-slate-500 ">{license.ownerEmail || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 ">
                      {formatDate(license.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 ">
                      {license.expiresAt ? formatDate(license.expiresAt) : 'Nunca'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === license.serial ? null : license.serial)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {openDropdown === license.serial && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-20 overflow-hidden">
                              {license.status === 'activated' && (
                                <button
                                  onClick={() => handleAction('suspend', license)}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-yellow-50 flex items-center gap-3 text-slate-700 hover:text-yellow-700 transition-colors"
                                >
                                  <Ban size={16} />
                                  Suspender
                                </button>
                              )}
                              
                              {license.status === 'suspended' && (
                                <button
                                  onClick={() => handleAction('reactivate', license)}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 flex items-center gap-3 text-slate-700 hover:text-green-700 transition-colors"
                                >
                                  <RefreshCw size={16} />
                                  Reactivar
                                </button>
                              )}
                              
                              {license.status !== 'revoked' && (
                                <button
                                  onClick={() => handleAction('revoke', license)}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-slate-700 hover:text-red-700 transition-colors border-t border-slate-100 "
                                >
                                  <XCircle size={16} />
                                  Revocar
                                </button>
                              )}
                              
                              {license.status !== 'activated' && (
                                <button
                                  onClick={() => handleAction('delete', license)}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors border-t border-slate-100 "
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, license: null })}
        onConfirm={executeConfirmedAction}
        title={
          confirmDialog.action === 'bulk-delete'
            ? `Eliminar ${selectedSerials.size} licencias`
            : confirmDialog.action === 'delete'
            ? 'Eliminar Licencia'
            : confirmDialog.action === 'revoke'
            ? 'Revocar Licencia'
            : 'Suspender Licencia'
        }
        message={
          confirmDialog.action === 'bulk-delete'
            ? `¿Estás seguro de eliminar ${selectedSerials.size} licencia(s)? Esta acción no se puede deshacer.`
            : confirmDialog.action === 'delete'
            ? `¿Estás seguro de eliminar la licencia ${confirmDialog.license?.serial}? Esta acción no se puede deshacer.`
            : confirmDialog.action === 'revoke'
            ? `¿Revocar la licencia ${confirmDialog.license?.serial}? La tienda perderá acceso inmediatamente.`
            : `¿Suspender temporalmente la licencia ${confirmDialog.license?.serial}?`
        }
        confirmText={
          confirmDialog.action === 'bulk-delete' || confirmDialog.action === 'delete'
            ? 'Eliminar'
            : confirmDialog.action === 'revoke'
            ? 'Revocar'
            : 'Suspender'
        }
        variant={confirmDialog.action === 'suspend' ? 'warning' : 'danger'}
        isLoading={
          suspendMutation.isPending || revokeMutation.isPending || deleteMutation.isPending || bulkDeleteMutation.isPending
        }
      />
    </>
  );
}
