import { apiClient } from './client';

export interface LandingContent {
  hero?: any;
  pricing?: any;
  socialProof?: any;
  features?: any;
  faq?: any;
  [key: string]: any;
}

export const landingApi = {
  getConfig: async () => {
    const response = await apiClient.get<{ content: LandingContent }>('/landing-config');
    return response.data;
  },

  updateConfig: async (content: LandingContent) => {
    const response = await apiClient.put('/landing-config', { content });
    return response.data;
  },
};
