import axios from 'axios';
import { getStoreHeaders } from '../utils/storeDetection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface LicenseInfo {
  serial: string;
  plan: string;
  status: string;
  expiresAt: Date | null;
  maxProducts: number | null;
  maxOrders: number | null;
}

export const licenseApi = {
  /**
   * Activate a license
   */
  activate: async (serial: string) => {
    const response = await axios.post(`${API_URL}/license/activate`, { serial });
    return response.data;
  },
  
  /**
   * Get current license status
   */
  getStatus: async (): Promise<{ activated: boolean; license?: LicenseInfo }> => {
    const response = await axios.get(`${API_URL}/license/status`, {
      headers: getStoreHeaders()
    });
    return response.data;
  },
  
  /**
   * Send check-in (health check)
   */
  checkIn: async (serial: string, stats?: any) => {
    const response = await axios.post(`${API_URL}/license/checkin`, { serial, stats });
    return response.data;
  },
};
