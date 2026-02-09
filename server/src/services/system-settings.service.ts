/**
 * System Settings Service
 * Handles global configuration stored in the database
 */

import { db } from '../db/drizzle.js';
import { systemSettings, type SystemSettings, type NewSystemSettings } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Simple encryption for sensitive values
// In production, use a proper secrets manager like AWS Secrets Manager
// In production, we MUST have a secure key. In dev, we can use a derived one from JWT_SECRET or a placeholder warning.
// ENCRYPTION_KEY handling:
// If provided key is not exactly 32 chars, we pad or truncate it to ensure AES-256 compatibility.
// This prevents crashes on deployment if the user provides a key of incorrect length.
const RAW_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-insecure-key-do-not-use-in-prod';
const ENCRYPTION_KEY = RAW_KEY.padEnd(32, '0').slice(0, 32);

if (process.env.NODE_ENV === 'production' && RAW_KEY.length < 10) {
    console.warn('⚠️ WARNING: ENCRYPTION_KEY is very short. Ensure it is secure.');
}
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return ''; // Return empty if decryption fails
  }
}

// Mask sensitive values for display
function maskSecret(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

export class SystemSettingsService {
  /**
   * Get current system settings
   */
  static async get(): Promise<SystemSettings | null> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global')).limit(1);
    return result[0] || null;
  }

  /**
   * Get settings with decrypted values (for internal use only)
   */
  static async getDecrypted(): Promise<SystemSettings | null> {
    const settings = await this.get();
    if (!settings) return null;

    return {
      ...settings,
      smtpPass: settings.smtpPass ? decrypt(settings.smtpPass) : null,
      sentryDsn: settings.sentryDsn ? decrypt(settings.sentryDsn) : null,
      cloudinaryApiKey: settings.cloudinaryApiKey ? decrypt(settings.cloudinaryApiKey) : null,
      cloudinaryApiSecret: settings.cloudinaryApiSecret ? decrypt(settings.cloudinaryApiSecret) : null,
    };
  }

  /**
   * Get settings with masked secrets (for display in UI)
   */
  static async getMasked(): Promise<any> {
    const settings = await this.get();
    if (!settings) {
      return {
        id: 'global',
        smtp: { configured: false },
        sentry: { configured: false, enabled: false },
        cloudinary: { configured: false },
      };
    }

    return {
      id: settings.id,
      smtp: {
        configured: !!settings.smtpHost,
        host: settings.smtpHost || '',
        port: settings.smtpPort || '587',
        secure: settings.smtpSecure ?? true,
        user: settings.smtpUser || '',
        pass: maskSecret(settings.smtpPass ? decrypt(settings.smtpPass) : null),
        fromEmail: settings.smtpFromEmail || '',
        fromName: settings.smtpFromName || '',
      },
      sentry: {
        configured: !!settings.sentryDsn,
        enabled: settings.sentryEnabled ?? false,
        dsn: maskSecret(settings.sentryDsn ? decrypt(settings.sentryDsn) : null),
      },
      cloudinary: {
        configured: !!settings.cloudinaryCloudName,
        cloudName: settings.cloudinaryCloudName || '',
        apiKey: maskSecret(settings.cloudinaryApiKey ? decrypt(settings.cloudinaryApiKey) : null),
        apiSecret: maskSecret(settings.cloudinaryApiSecret ? decrypt(settings.cloudinaryApiSecret) : null),
      },
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    };
  }

  /**
   * Update system settings
   */
  static async update(data: Partial<{
    smtpHost: string;
    smtpPort: string;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPass: string;
    smtpFromEmail: string;
    smtpFromName: string;
    sentryDsn: string;
    sentryEnabled: boolean;
    cloudinaryCloudName: string;
    cloudinaryApiKey: string;
    cloudinaryApiSecret: string;
  }>, updatedBy: string): Promise<SystemSettings> {
    // Encrypt sensitive values if provided
    const updateData: Partial<NewSystemSettings> = {
      updatedAt: new Date(),
      updatedBy,
    };

    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost;
    if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort;
    if (data.smtpSecure !== undefined) updateData.smtpSecure = data.smtpSecure;
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser;
    if (data.smtpPass !== undefined && !data.smtpPass.includes('****')) {
      updateData.smtpPass = encrypt(data.smtpPass);
    }
    if (data.smtpFromEmail !== undefined) updateData.smtpFromEmail = data.smtpFromEmail;
    if (data.smtpFromName !== undefined) updateData.smtpFromName = data.smtpFromName;

    if (data.sentryEnabled !== undefined) updateData.sentryEnabled = data.sentryEnabled;
    if (data.sentryDsn !== undefined && !data.sentryDsn.includes('****')) {
      updateData.sentryDsn = encrypt(data.sentryDsn);
    }

    if (data.cloudinaryCloudName !== undefined) updateData.cloudinaryCloudName = data.cloudinaryCloudName;
    if (data.cloudinaryApiKey !== undefined && !data.cloudinaryApiKey.includes('****')) {
      updateData.cloudinaryApiKey = encrypt(data.cloudinaryApiKey);
    }
    if (data.cloudinaryApiSecret !== undefined && !data.cloudinaryApiSecret.includes('****')) {
      updateData.cloudinaryApiSecret = encrypt(data.cloudinaryApiSecret);
    }

    // Upsert: insert if not exists, update if exists
    const existing = await this.get();
    
    if (existing) {
      await db.update(systemSettings)
        .set(updateData)
        .where(eq(systemSettings.id, 'global'));
    } else {
      await db.insert(systemSettings).values({
        id: 'global',
        ...updateData,
      });
    }

    return (await this.get())!;
  }

  /**
   * Initialize the settings table if it doesn't exist
   */
  static async initTable(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_settings (
          id TEXT PRIMARY KEY DEFAULT 'global',
          smtp_host TEXT,
          smtp_port TEXT,
          smtp_secure BOOLEAN DEFAULT true,
          smtp_user TEXT,
          smtp_pass TEXT,
          smtp_from_email TEXT,
          smtp_from_name TEXT,
          sentry_dsn TEXT,
          sentry_enabled BOOLEAN DEFAULT false,
          cloudinary_cloud_name TEXT,
          cloudinary_api_key TEXT,
          cloudinary_api_secret TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT
        )
      `);
      console.log('✅ System settings table ready');
    } catch (error) {
      console.error('Error creating system_settings table:', error);
    }
  }
}
