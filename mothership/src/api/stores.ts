import { apiClient } from './client';

export interface Store {
  id: string;
  name: string;
  domain: string | null;
  customDomain: string | null;
  status: string;
  plan: string;
  licenseKey: string | null;
  ownerEmail: string;
  ownerName: string | null;
  createdAt: string;
  lastCheckIn: string | null;
  license?: {
    serial: string;
    plan: string;
    status: string;
    expiresAt: string | null;
    maxProducts: number | null;
    maxOrders: number | null;
  };
}

export interface StoresResponse {
  stores?: Store[];
  data?: {
    stores: Store[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface CreateStoreData {
  name: string;
  ownerEmail: string;
  ownerName?: string;
  // Note: plan and duration removed - controlled by license
}

export const storesApi = {
  // Get all stores with filters
  getAll: async (filters?: { status?: string; plan?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plan) params.append('plan', filters.plan);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    
    return apiClient.get<StoresResponse>(`/mothership/stores?${params.toString()}`);
  },

  // Get store by ID
  getById: async (id: string) => {
    return apiClient.get(`/mothership/stores/${id}`);
  },

  // Create new store (without license)
  create: async (data: CreateStoreData) => {
    return apiClient.post('/mothership/stores', data);
  },

  // Assign license to store
  assignLicense: async (storeId: string, licenseSerial: string) => {
    return apiClient.post(`/mothership/stores/${storeId}/assign-license`, { licenseSerial });
  },

  // Update store
  update: async (id: string, data: Partial<Store>) => {
    return apiClient.patch(`/mothership/stores/${id}`, data);
  },

  // Suspend store
  suspend: async (id: string) => {
    return apiClient.patch(`/mothership/stores/${id}`, { status: 'suspended' });
  },

  // Reactivate store
  reactivate: async (id: string) => {
    return apiClient.patch(`/mothership/stores/${id}`, { status: 'active' });
  },

  // Delete store
  delete: async (id: string) => {
    return apiClient.delete(`/mothership/stores/${id}`);
  },

  // Bulk delete stores
  bulkDelete: async (ids: string[]) => {
    return apiClient.post<{ success: boolean; message: string; deletedCount: number }>('/mothership/stores/bulk-delete', { ids });
  },

  // Get store stats
  getStats: async (id: string) => {
    return apiClient.get(`/mothership/stores/${id}/stats`);
  },

  // Get global dashboard stats
  getGlobalStats: async () => {
    return apiClient.get<{
      stores: { total: number; active: number };
      licenses: { total: number; active: number };
      activity: { totalCustomers: number; totalOrders: number };
      history: {
        orders: { date: string; count: number }[];
        stores: { name: string; count: number }[];
      };
    }>('/mothership/stores/stats');
  },

  // Reset admin password
  resetPassword: async (storeId: string, email: string, newPassword: string) => {
    return apiClient.post(`/mothership/stores/${storeId}/reset-password`, { email, newPassword });
  },
};
