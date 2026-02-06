import { useState } from 'react';
import { useStores } from '../hooks/useStores';
import { useStoreActions } from '../hooks/useStoreActions';
import Button from '../components/ui/Button';
import { Plus, Search, Store, Trash2 } from 'lucide-react';

// Components
import StoreTable from '../components/stores/StoreTable';
import CreateStoreModal from '../components/stores/CreateStoreModal';
import StoreActionsModal from '../components/stores/StoreActionsModal';
import ResetPasswordModal from '../components/stores/ResetPasswordModal';
import StoreCreatedModal from '../components/stores/StoreCreatedModal';
import DeleteStoreModal from '../components/stores/DeleteStoreModal';
import BulkDeleteModal from '../components/stores/BulkDeleteModal';

export default function Stores() {
  const [filters, setFilters] = useState({ status: '', plan: '', search: '' });
  const { data: response, isLoading, error } = useStores(filters);
  const stores = response?.data?.data?.stores || response?.data?.stores || [];

  const {
    // State
    isCreateModalOpen, setIsCreateModalOpen,
    actionStore, setActionStore,
    deleteConfirmId, setDeleteConfirmId,
    createdStore, setCreatedStore,
    resetPasswordStore, setResetPasswordStore,
    bulkDeleteConfirm, setBulkDeleteConfirm,
    selectedIds,
    formError,

    // Loading
    isCreating,
    isDeleting,
    isBulkDeleting,

    // Handlers
    handleCreateStore,
    handleDelete,
    handleBulkDelete,
    handleResetPassword,
    handleSelectAll,
    handleSelectOne,
    suspendStore,
    reactivateStore
  } = useStoreActions();
  
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 ">Tiendas</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} className="inline mr-2" />Nueva Tienda
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-100 ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 ">
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="pending">Pendientes</option>
            <option value="suspended">Suspendidas</option>
          </select>
          <select value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 ">
            <option value="">Todos los planes</option>
            <option value="free">Free</option><option value="starter">Starter</option>
            <option value="pro">Pro</option><option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-red-800 ">
            {selectedIds.size} tienda(s) seleccionada(s)
          </span>
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Eliminar seleccionadas
          </button>
        </div>
      )}
      
      {/* Table */}
      <StoreTable 
        stores={stores}
        isLoading={isLoading}
        error={error}
        selectedIds={selectedIds}
        onSelectAll={(checked) => handleSelectAll(stores, checked)}
        onSelectOne={handleSelectOne}
        onAction={setActionStore}
      />

      {/* Modals */}
      <DeleteStoreModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        isDeleting={isDeleting}
      />

      <BulkDeleteModal 
        isOpen={bulkDeleteConfirm}
        count={selectedIds.size}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />

      {actionStore && (
        <StoreActionsModal 
          store={actionStore}
          onClose={() => setActionStore(null)}
          onResetPassword={(store) => setResetPasswordStore(store)}
          onSuspend={(id) => suspendMutation(id)}
          onReactivate={(id) => reactivateMutation(id)}
          onDelete={(id) => setDeleteConfirmId(id)}
        />
      )}

      {isCreateModalOpen && (
        <CreateStoreModal 
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateStore}
          isCreating={isCreating}
          error={formError}
        />
      )}

      <StoreCreatedModal 
        store={createdStore as any}
        onClose={() => setCreatedStore(null)}
      />

      <ResetPasswordModal 
        store={resetPasswordStore}
        onClose={() => setResetPasswordStore(null)}
        onReset={handleResetPassword}
      />
    </div>
  );
}
