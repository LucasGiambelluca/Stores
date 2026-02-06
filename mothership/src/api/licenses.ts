import { apiClient } from './client';
import type { License, CreateLicenseInput, UpdateLicenseInput, LicenseStats } from '../types/license';

export const licensesApi = {
  create: (data: CreateLicenseInput) =>
    apiClient.post<{ success: boolean; license: License }>('/mothership/licenses', data),
  
  getAll: (filters?: { status?: string; plan?: string; search?: string }) =>
    apiClient.get<{ licenses: License[] }>('/mothership/licenses', { params: filters }),
  
  getStats: () =>
    apiClient.get<{ stats: LicenseStats }>('/mothership/licenses/stats'),
  
  getOne: (serial: string) =>
    apiClient.get<{ license: License }>(`/mothership/licenses/${serial}`),
  
  update: (serial: string, data: UpdateLicenseInput) =>
    apiClient.put<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`, data),
  
  delete: (serial: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`),

  bulkDelete: (serials: string[]) =>
    apiClient.post<{ success: boolean; message: string; deletedCount: number }>('/mothership/licenses/bulk-delete', { serials }),

  // Helper functions for common actions
  suspend: (serial: string, notes?: string) =>
    apiClient.put<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`, {
      action: 'suspend',
      notes,
    }),

  reactivate: (serial: string) =>
    apiClient.put<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`, {
      action: 'activate',
    }),

  revoke: (serial: string, notes?: string) =>
    apiClient.put<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`, {
      action: 'revoke',
      notes,
    }),

  renew: (serial: string, duration: string) =>
    apiClient.put<{ success: boolean; message: string }>(`/mothership/licenses/${serial}`, {
      action: 'renew',
      duration,
    }),
};
