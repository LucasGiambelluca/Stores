import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesApi } from '../api/licenses';

export function useLicenses(filters?: { status?: string; plan?: string; search?: string }) {
  return useQuery({
    queryKey: ['licenses', filters],
    queryFn: () => licensesApi.getAll(filters),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useLicenseStats() {
  return useQuery({
    queryKey: ['license-stats'],
    queryFn: () => licensesApi.getStats(),
    staleTime: 120000, // 2 minutes - stats don't change often
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => licensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
    },
  });
}

export function useRevokeLicense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (serial: string) => licensesApi.revoke(serial),
    // Optimistic update for instant feedback
    onMutate: async (serial) => {
      await queryClient.cancelQueries({ queryKey: ['licenses'] });
      const previous = queryClient.getQueryData(['licenses']);
      
      queryClient.setQueryData(['licenses'], (old: any) => {
        if (!old?.data?.licenses) return old;
        return {
          ...old,
          data: {
            ...old.data,
            licenses: old.data.licenses.map((l: any) =>
              l.serial === serial ? { ...l, status: 'revoked' } : l
            ),
          },
        };
      });
      
      return { previous };
    },
    onError: (_err, _serial, context) => {
      queryClient.setQueryData(['licenses'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
    },
  });
}

