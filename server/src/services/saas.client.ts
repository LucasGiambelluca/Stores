import { db, storeConfig } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';

// Mock Central Server URL (internal for now)
const DEFAULT_CENTRAL_URL = 'http://localhost:3005/api/central';

export class SaasClient {
  private static async getConfig() {
    // Get license key from store_config instead of saasSettings
    const licenseKeyResult = await db.select().from(storeConfig).where(eq(storeConfig.key, 'license_key')).limit(1);
    const statusResult = await db.select().from(storeConfig).where(eq(storeConfig.key, 'saas_status')).limit(1);

    return {
      licenseKey: licenseKeyResult[0]?.value || null,
      status: statusResult[0]?.value || 'active',
      centralApiUrl: DEFAULT_CENTRAL_URL
    };
  }

  static async checkStatus() {
    try {
      const config = await this.getConfig();
      if (!config || !config.licenseKey) {
        return { status: 'inactive', message: 'No active license' };
      }

      const centralUrl = config.centralApiUrl || DEFAULT_CENTRAL_URL;
      
      // In a real scenario, this would be a fetch to the external server
      // const response = await fetch(`${centralUrl}/validate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ licenseKey: config.licenseKey })
      // });
      
      // For this mock implementation, we'll call our own internal API or just simulate
      // Since we are running in the same process, we can't easily fetch our own API if it's single threaded
      // So we will simulate the network call logic here or assume the local DB status is the source of truth
      // updated by the "Central Controller" (which acts as the external server)
      
      // In the "Centralized" model, the local DB status is updated by the polling mechanism.
      // Here we just return what's in the DB, assuming the "Central Controller" updates it directly
      // or we implement the actual fetch when we split the servers.
      
      return { status: config.status || 'active' };

    } catch (error) {
      console.error('SaaS Check Status Error:', error);
      return { status: 'error', message: 'Connection failed' };
    }
  }

  static async sendErrorLog(error: any) {
    try {
      const config = await this.getConfig();
      if (!config) return;

      const centralUrl = config.centralApiUrl || DEFAULT_CENTRAL_URL;
      
      // Fire and forget
      fetch(`${centralUrl}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: config.licenseKey,
          error: error.message || error,
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      }).catch(err => console.error('Failed to send error log:', err));

    } catch (e) {
      // Ignore errors in error logging to prevent loops
    }
  }
}
