/**
 * System Settings API Client
 */

import { apiClient } from './client';

export interface SystemSettingsResponse {
  id: string;
  smtp: {
    configured: boolean;
    host: string;
    port: string;
    secure: boolean;
    user: string;
    pass: string; // Masked
    fromEmail: string;
    fromName: string;
  };
  sentry: {
    configured: boolean;
    enabled: boolean;
    dsn: string; // Masked
  };
  cloudinary: {
    configured: boolean;
    cloudName: string;
    apiKey: string; // Masked
    apiSecret: string; // Masked
  };
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SmtpSettings {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export interface SentrySettings {
  enabled: boolean;
  dsn: string;
}

export interface CloudinarySettings {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export const systemSettingsApi = {
  /**
   * Get current system settings
   */
  getSettings: async (): Promise<SystemSettingsResponse> => {
    const response = await apiClient.get('/system/settings');
    return response.data;
  },

  /**
   * Update SMTP settings
   */
  updateSmtp: async (settings: Partial<SmtpSettings>): Promise<SystemSettingsResponse> => {
    const response = await apiClient.put('/system/settings', {
      smtpHost: settings.host,
      smtpPort: settings.port,
      smtpSecure: settings.secure,
      smtpUser: settings.user,
      smtpPass: settings.pass,
      smtpFromEmail: settings.fromEmail,
      smtpFromName: settings.fromName,
    });
    return response.data.settings;
  },

  /**
   * Update Sentry settings
   */
  updateSentry: async (settings: Partial<SentrySettings>): Promise<SystemSettingsResponse> => {
    const response = await apiClient.put('/system/settings', {
      sentryEnabled: settings.enabled,
      sentryDsn: settings.dsn,
    });
    return response.data.settings;
  },

  /**
   * Update Cloudinary settings
   */
  updateCloudinary: async (settings: Partial<CloudinarySettings>): Promise<SystemSettingsResponse> => {
    const response = await apiClient.put('/system/settings', {
      cloudinaryCloudName: settings.cloudName,
      cloudinaryApiKey: settings.apiKey,
      cloudinaryApiSecret: settings.apiSecret,
    });
    return response.data.settings;
  },

  /**
   * Test SMTP connection
   */
  testSmtp: async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await apiClient.post('/system/settings/test-smtp');
    return response.data;
  },

  /**
   * Test Sentry DSN
   */
  testSentry: async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await apiClient.post('/system/settings/test-sentry');
    return response.data;
  },
};
