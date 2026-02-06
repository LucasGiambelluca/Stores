import { Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { licenses, stores, storeConfig } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { LicenseGenerator } from '../utils/license-generator.js';

/**
 * ACTIVATE - Activate a license for a store
 * OPTIMIZED: Uses transaction for atomicity
 * This is called by the client store when they input their serial
 */
export async function activateLicense(req: Request, res: Response) {
  try {
    const { serial } = req.body;
    
    // Validate serial format
    if (!serial || !LicenseGenerator.validate(serial)) {
      return res.status(400).json({ 
        error: 'Invalid serial format',
        message: 'El serial debe tener el formato TND-XXXX-XXXX-XXXX'
      });
    }
    
    // Find license
    const [license] = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, serial))
      .limit(1);
    
    if (!license) {
      return res.status(404).json({ 
        error: 'License not found',
        message: 'Serial no encontrado. Verifica que esté correcto.'
      });
    }
    
    // Check if revoked
    if (license.status === 'revoked') {
      return res.status(400).json({ 
        error: 'License revoked',
        message: 'Este serial ha sido revocado.'
      });
    }
    
    // Check if expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return res.status(400).json({ 
        error: 'License expired',
        message: 'Este serial ha expirado.'
      });
    }
    
    // Get store to activate
    const storeIdToActivate = req.body.storeId || req.storeId;

    if (!storeIdToActivate) {
      return res.status(400).json({ 
        error: 'Store ID required',
        message: 'No se especificó la tienda para activar.'
      });
    }

    const [currentStore] = await db.select()
      .from(stores)
      .where(eq(stores.id, storeIdToActivate))
      .limit(1);
    
    if (!currentStore) {
      return res.status(404).json({ 
        error: 'Store not found',
        message: 'No se encontró la tienda especificada.'
      });
    }
    
    // Check if already activated by ANOTHER store
    if (license.storeId && license.status === 'activated' && license.storeId !== currentStore.id) {
      return res.status(400).json({ 
        error: 'License already activated',
        message: 'Este serial ya está activado en otra tienda.'
      });
    }
    
    // Execute all writes in a transaction for atomicity
    // If any step fails, all changes are rolled back
    await db.transaction(async (tx) => {
      const now = new Date();
      
      // 1. Update license status
      await tx.update(licenses)
        .set({
          status: 'activated',
          storeId: currentStore.id,
          activatedAt: now,
          lastCheckIn: now,
        })
        .where(eq(licenses.serial, serial));
      
      // 2. Update store with license info
      await tx.update(stores)
        .set({
          licenseKey: serial,
          plan: license.plan,
          status: 'active',
        })
        .where(eq(stores.id, currentStore.id));
      
      // 3. Batch delete old config entries (single query)
      const configKeys = ['license_key', 'license_status', 'license_plan'];
      await tx.delete(storeConfig)
        .where(and(
          inArray(storeConfig.key, configKeys),
          eq(storeConfig.storeId, currentStore.id)
        ));
      
      // 4. Batch insert new config entries (single query)
      await tx.insert(storeConfig).values([
        { key: 'license_key', value: serial, storeId: currentStore.id },
        { key: 'license_status', value: 'activated', storeId: currentStore.id },
        { key: 'license_plan', value: license.plan, storeId: currentStore.id },
      ]);
    });
    
    console.log('[License Activation] ✅ License activated successfully!');
    
    res.json({
      success: true,
      message: '¡Licencia activada exitosamente!',
      license: {
        serial: license.serial,
        plan: license.plan,
        expiresAt: license.expiresAt,
        maxProducts: license.maxProducts,
        maxOrders: license.maxOrders,
      }
    });
  } catch (error) {
    console.error('[License Activation] ❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to activate license',
      message: 'Error al activar la licencia. Intenta de nuevo.'
    });
  }
}

/**
 * CHECK-IN - Store sends health check
 * Called periodically to update last_check_in
 */
export async function checkIn(req: Request, res: Response) {
  try {
    const { serial, stats } = req.body;
    
    if (!serial) {
      return res.status(400).json({ error: 'Serial required' });
    }
    
    // Find license
    const [license] = await db.select()
      .from(licenses)
      .where(and(
        eq(licenses.serial, serial),
        eq(licenses.status, 'activated')
      ))
      .limit(1);
    
    if (!license) {
      return res.status(404).json({ error: 'License not found or not activated' });
    }
    
    // Update last check-in
    await db.update(licenses)
      .set({ lastCheckIn: new Date() })
      .where(eq(licenses.serial, serial));
    
    // If store exists, update it too
    if (license.storeId) {
      await db.update(stores)
        .set({ lastCheckIn: new Date() })
        .where(eq(stores.id, license.storeId));
    }
    
    res.json({ 
      success: true,
      status: license.status,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
}

/**
 * GET LICENSE STATUS - Check current license status
 */
export async function getLicenseStatus(req: Request, res: Response) {
  try {
    // Get storeId from middleware (set by storeResolver)
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.json({ 
        activated: false,
        message: 'Store context required'
      });
    }
    
    // Multi-tenant: Get license key from store config filtered by storeId
    const [licenseConfig] = await db.select()
      .from(storeConfig)
      .where(and(
        eq(storeConfig.key, 'license_key'),
        eq(storeConfig.storeId, storeId)
      ))
      .limit(1);
    
    if (!licenseConfig || !licenseConfig.value) {
      return res.json({ 
        activated: false,
        message: 'No license activated'
      });
    }
    
    // Get license details
    const [license] = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, licenseConfig.value as string))
      .limit(1);
    
    if (!license) {
      return res.json({ 
        activated: false,
        message: 'License not found'
      });
    }
    
    res.json({
      activated: true,
      license: {
        serial: license.serial,
        plan: license.plan,
        status: license.status,
        expiresAt: license.expiresAt,
        maxProducts: license.maxProducts,
        maxOrders: license.maxOrders,
      }
    });
  } catch (error) {
    console.error('Get license status error:', error);
    res.status(500).json({ error: 'Failed to get license status' });
  }
}
