import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesApi, type Store, type CreateStoreData } from '../api/stores';

interface StoreFilters {
  status?: string;
  plan?: string;
  search?: string;
  page?: number;
}

export function useStores(filters?: StoreFilters) {
  return useQuery({
    queryKey: ['stores', filters],
    queryFn: () => storesApi.getAll(filters),
    staleTime: 60000, // 1 minute - data is fresh
    gcTime: 300000, // 5 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: () => storesApi.getById(id),
    enabled: !!id,
    staleTime: 60000,
    gcTime: 300000,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateStoreData) => storesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Store> }) => 
      storesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useSuspendStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => storesApi.suspend(id),
    // Optimistic update for instant feedback
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['stores'] });
      const previous = queryClient.getQueryData(['stores']);
      queryClient.setQueryData(['stores'], (old: any) => {
        if (!old?.data?.data?.stores) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              stores: old.data.data.stores.map((s: Store) =>
                s.id === id ? { ...s, status: 'suspended' } : s
              ),
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['stores'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useReactivateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => storesApi.reactivate(id),
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['stores'] });
      const previous = queryClient.getQueryData(['stores']);
      queryClient.setQueryData(['stores'], (old: any) => {
        if (!old?.data?.data?.stores) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              stores: old.data.data.stores.map((s: Store) =>
                s.id === id ? { ...s, status: 'active' } : s
              ),
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['stores'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => storesApi.delete(id),
    // Optimistic update - remove from list immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['stores'] });
      const previous = queryClient.getQueryData(['stores']);
      queryClient.setQueryData(['stores'], (old: any) => {
        if (!old?.data?.data?.stores) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              stores: old.data.data.stores.filter((s: Store) => s.id !== id),
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['stores'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useBulkDeleteStores() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) => storesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export interface StoreStats {
  stores: { total: number; active: number };
  licenses: { total: number; active: number };
  activity: { totalCustomers: number; totalOrders: number };
  history: {
    orders: { date: string; count: number }[];
    stores: { name: string; count: number }[];
  };
}

export function useStoreStats() {
  return useQuery({
    queryKey: ['store-stats'],
    queryFn: () => storesApi.getGlobalStats(),
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: false,
  });
}
