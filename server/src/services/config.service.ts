import { db } from '../db/drizzle.js';
import { storeConfig } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/encryption.js';
import { storeService } from './store.service.js';

export class ConfigService {
  // Keys that contain sensitive data and should be encrypted
  private readonly SENSITIVE_KEYS = ['api_key', 'secret', 'password', 'token'];

  /**
   * Check if a config key should be encrypted
   */
  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  /**
   * Get a config value from database, with .env fallback
   */
  async getConfigValue(key: string, storeId: string, envFallback?: string): Promise<string | null> {
    try {
      const result = await db.select()
        .from(storeConfig)
        .where(
          and(
            eq(storeConfig.key, key),
            eq(storeConfig.storeId, storeId)
          )
        )
        .limit(1);

      if (result.length > 0 && result[0].value !== null) {
        // Convert jsonb value to string
        const value = typeof result[0].value === 'string' 
          ? result[0].value 
          : JSON.stringify(result[0].value);
        // Decrypt if needed
        return this.isSensitiveKey(key) ? decrypt(value) : value;
      }
    } catch (error) {
      console.warn(`Failed to get config ${key} from DB:`, error);
    }
    return envFallback || null;
  }

  /**
   * Set a config value in database
   */
  async setConfigValue(key: string, value: string, storeId: string): Promise<void> {
    try {
      // Encrypt sensitive values
      const storedValue = this.isSensitiveKey(key) ? encrypt(value) : value;
      
      // Upsert - insert or update
      // Check for existing config SPECIFIC to this store
      const existing = await db.select()
        .from(storeConfig)
        .where(
          and(
            eq(storeConfig.key, key),
            eq(storeConfig.storeId, storeId)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(storeConfig)
          .set({ value: storedValue, updatedAt: new Date() })
          .where(
            and(
              eq(storeConfig.key, key),
              eq(storeConfig.storeId, storeId)
            )
          );
      } else {
        await db.insert(storeConfig).values({
          key,
          storeId,
          value: storedValue,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Failed to set config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all config as an object, optionally filtered by storeId
   */
  async getAllConfig(storeId?: string): Promise<Record<string, string>> {
    try {
      let rows;
      if (storeId) {
        // Filter by storeId for multi-tenant
        rows = await db.select().from(storeConfig).where(eq(storeConfig.storeId, storeId));
      } else {
        // Fallback to all config (legacy)
        rows = await db.select().from(storeConfig);
      }
      
      const config: Record<string, string> = {};
      
      for (const row of rows) {
        // Convert jsonb value to string
        const rawValue = row.value;
        const stringValue = typeof rawValue === 'string' 
          ? rawValue 
          : JSON.stringify(rawValue);
        config[row.key] = this.isSensitiveKey(row.key) ? decrypt(stringValue) : stringValue;
      }
      
      return config;
    } catch (error) {
      console.warn('Failed to get all config from DB:', error);
      return {};
    }
  }

  /**
   * Initial setup logic
   */
  async initialSetup(updates: any) {
    // Check if already configured
    const dbConfig = await this.getAllConfig();
    if (dbConfig['is_configured'] === 'true') {
      throw new Error('La tienda ya está configurada');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Datos de configuración inválidos');
    }

    // Handle Clean Slate if requested
    if (updates.cleanStart) {
      await storeService.clearStoreData();
      
      // Seed categories if provided
      if (updates.categories && Array.isArray(updates.categories)) {
        await storeService.seedTemplateData(updates.category || 'General', updates.categories);
      }
    }

    // Map frontend config structure to database keys
    const configMap: Record<string, string | undefined> = {
      'store_name': updates.name,
      'store_slogan': updates.tagline,
      'store_logo': updates.logo,
      'store_email': updates.email,
      'social_whatsapp': updates.whatsapp,
      'social_instagram': updates.instagram?.replace('@', ''),
      'address_street': updates.address,
      'theme_primary': updates.colors?.primary,
      'theme_secondary': updates.colors?.secondary,
      'theme_accent': updates.colors?.accent,
      'theme_accent_hover': updates.colors?.accentHover,
      'theme_text': updates.colors?.text,
      'theme_background': updates.colors?.background,
      'is_configured': 'true',
    };

    // Get first store for config (assuming single store for now or default store)
    const store = await db.query.stores.findFirst();
    if (!store) {
      throw new Error('No store found');
    }

    // Save each non-undefined value
    for (const [key, value] of Object.entries(configMap)) {
      if (value !== undefined && value !== null) {
        await this.setConfigValue(key, value, store.id);
      }
    }

    return 'Tienda configurada correctamente';
  }
}

export const configService = new ConfigService();
