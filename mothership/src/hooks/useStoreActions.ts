import { useState } from 'react';
import { useDeleteStore, useSuspendStore, useReactivateStore, useCreateStore, useBulkDeleteStores } from './useStores';
import { storesApi } from '../api/stores';

interface CreatedStore {
  id: string;
  name: string;
  domain: string;
  licenseKey: string | null;
  plan: string;
}

export function useStoreActions() {
  // Mutations
  const deleteMutation = useDeleteStore();
  const suspendMutation = useSuspendStore();
  const reactivateMutation = useReactivateStore();
  const createMutation = useCreateStore();
  const bulkDeleteMutation = useBulkDeleteStores();

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionStore, setActionStore] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [createdStore, setCreatedStore] = useState<CreatedStore | null>(null);
  const [resetPasswordStore, setResetPasswordStore] = useState<any>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState('');

  // Handlers
  const handleCreateStore = (data: { name: string; ownerEmail: string; ownerName: string }) => {
    setFormError('');
    createMutation.mutate(data, {
      onSuccess: (response: any) => {
        const store = response?.data?.store;
        if (store) {
          setCreatedStore({
            id: store.id,
            name: store.name,
            domain: store.domain,
            licenseKey: null,
            plan: 'none',
          });
        }
        setIsCreateModalOpen(false);
      },
      onError: (error: any) => {
        setFormError(error?.response?.data?.error || 'Error al crear la tienda');
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setBulkDeleteConfirm(false);
        setSelectedIds(new Set());
      }
    });
  };

  const handleResetPassword = async (password: string) => {
    if (!resetPasswordStore) return;
    await storesApi.resetPassword(
      resetPasswordStore.id,
      resetPasswordStore.ownerEmail,
      password
    );
  };

  const handleSelectAll = (stores: any[], checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(stores.map((s: any) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  return {
    // State
    isCreateModalOpen, setIsCreateModalOpen,
    actionStore, setActionStore,
    deleteConfirmId, setDeleteConfirmId,
    createdStore, setCreatedStore,
    resetPasswordStore, setResetPasswordStore,
    bulkDeleteConfirm, setBulkDeleteConfirm,
    selectedIds, setSelectedIds,
    formError, setFormError,

    // Loading States
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,

    // Handlers
    handleCreateStore,
    handleDelete,
    handleBulkDelete,
    handleResetPassword,
    handleSelectAll,
    handleSelectOne,
    
    // Direct Mutations (for simple actions)
    suspendStore: suspendMutation.mutate,
    reactivateStore: reactivateMutation.mutate,
  };
}
