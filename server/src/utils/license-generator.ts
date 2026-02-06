import { randomBytes } from 'crypto';

/**
 * License Generator Utility
 * Generates and validates license serials in format: TND-XXXX-XXXX-XXXX
 */
export class LicenseGenerator {
  /**
   * Generates a unique license serial
   * Format: TND-XXXX-XXXX-XXXX where X is hexadecimal
   */
  static generate(): string {
    const segments: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const segment = randomBytes(2)
        .toString('hex')
        .toUpperCase();
      segments.push(segment);
    }
    
    return `TND-${segments.join('-')}`;
  }
  
  /**
   * Validates license serial format
   */
  static validate(serial: string): boolean {
    return /^TND-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(serial);
  }
  
  /**
   * Calculates expiration date based on duration
   */
  static getExpirationDate(duration: string): Date | null {
    if (duration === 'lifetime') return null;
    
    const now = new Date();
    switch (duration) {
      case '1week':
        now.setDate(now.getDate() + 7);
        break;
      case '1year':
        now.setFullYear(now.getFullYear() + 1);
        break;
      case '6months':
        now.setMonth(now.getMonth() + 6);
        break;
      case '3months':
        now.setMonth(now.getMonth() + 3);
        break;
      case '1month':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        return null;
    }
    return now;
  }
  
  /**
   * Get plan limits configuration
   */
  static getPlanLimits(plan: string): { maxProducts: number | null; maxOrders: number | null } {
    const limits: Record<string, { maxProducts: number | null; maxOrders: number | null }> = {
      trial: { maxProducts: 5, maxOrders: 10 },
      free: { maxProducts: 10, maxOrders: 50 },
      starter: { maxProducts: 50, maxOrders: 100 },
      pro: { maxProducts: 2000, maxOrders: null },
      enterprise: { maxProducts: null, maxOrders: null },
    };
    return limits[plan] || limits.free;
  }

  /**
   * Hash a license key for secure storage
   * Uses bcrypt with cost factor 10
   */
  static async hashLicenseKey(licenseKey: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.hash(licenseKey, 10);
  }

  /**
   * Verify a license key against its hash
   */
  static async verifyLicenseKey(licenseKey: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.compare(licenseKey, hash);
  }
}

