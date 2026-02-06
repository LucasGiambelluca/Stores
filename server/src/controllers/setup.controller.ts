import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, users, storeConfig, stores, licenses } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function setupStore(req: Request, res: Response) {
  try {
    const { 
      adminEmail, 
      adminPassword, 
      storeName, 
      storeDomain, 
      licenseKey,
      // New fields from wizard
      tagline,
      logo,
      primaryColor,
      accentColor,
      email,
      whatsapp,
      instagram,
      address,
    } = req.body;

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Admin email and password are required' });
    }

    // Try to get storeId from body (explicit) or middleware (implicit)
    let storeId = req.body.storeId || req.storeId;
    const forceResetup = req.body.forceResetup === true; // Explicit flag to allow re-setup

    // 🛡️ PROTECTION: Check if store is already configured
    if (storeId && !forceResetup) {
      const existingConfig = await db.select()
        .from(storeConfig)
        .where(eq(storeConfig.storeId, storeId))
        .limit(50);
      
      const isConfigured = existingConfig.find(c => c.key === 'is_configured' && c.value === 'true');
      
      if (isConfigured) {
        console.log(`⚠️ Setup rejected: Store ${storeId} is already configured. Use forceResetup=true to override.`);
        return res.status(409).json({
          error: 'Esta tienda ya está configurada',
          message: 'No se puede volver a ejecutar el wizard en una tienda ya configurada. Si necesitás modificar la configuración, usá el panel de administración.',
          code: 'STORE_ALREADY_CONFIGURED'
        });
      }
    }
    
    await db.transaction(async (tx) => {
      let existingStore = null;
      let licensePlan = 'free'; // Default plan
      
      // 0. Validate License if provided (BEFORE creating store)
      if (licenseKey) {
        const [license] = await tx.select()
          .from(licenses)
          .where(eq(licenses.serial, licenseKey))
          .limit(1);
          
        if (!license) {
          throw new Error('El serial de licencia no es válido.');
        }
        
        if (license.status === 'revoked') {
          throw new Error('Este serial ha sido revocado.');
        }
        
        if (license.storeId && license.status === 'activated' && license.storeId !== storeId) {
          throw new Error('Este serial ya está activado en otra tienda.');
        }

        licensePlan = license.plan;
      }

      // If storeId from middleware, verify store exists
      if (storeId) {
        const storeResult = await tx.select()
          .from(stores)
          .where(eq(stores.id, storeId))
          .limit(1);
        existingStore = storeResult[0];

        // CRITICAL FIX: If storeId was provided but not found, DO NOT create a new one.
        // This prevents duplicate "ghost" stores when using stale IDs.
        if (!existingStore) {
          throw new Error(`La tienda con ID ${storeId} no existe. No se puede actualizar.`);
        }
      }
      
      if (existingStore) {
        console.log(`📦 Using existing store from Mothership: ${existingStore.name} (${storeId})`);
        
        // Update existing store record
        await tx.update(stores)
          .set({
            name: storeName || existingStore.name,
            domain: storeDomain || existingStore.domain,
            ownerEmail: adminEmail,
            ownerName: 'Admin',
            licenseKey: licenseKey || existingStore.licenseKey,
            plan: licenseKey ? licensePlan : existingStore.plan, // Update plan if license provided
            status: 'active', // Mark as active when setup is completed
          })
          .where(eq(stores.id, storeId!));
          
      } else {
        // Create NEW store (ONLY if no storeId provided)
        console.log('🆕 Creating new store (no storeId provided)');
        storeId = uuidv4();
        
        await tx.insert(stores).values({
          id: storeId,
          name: storeName || 'My Store',
          domain: storeDomain || 'localhost',
          ownerEmail: adminEmail,
          ownerName: 'Admin',
          licenseKey: licenseKey || null,
          status: 'active',
          plan: licenseKey ? licensePlan : 'free',
        });
      }

      const userId = uuidv4();

      // 2. Create Admin User (with store_id reference)
      // Check if user exists first
      const existingUser = await tx.select().from(users).where(eq(users.email, adminEmail)).limit(1);
      
      if (existingUser.length > 0) {
        // If user exists, we can't create another one with same email (unique constraint)
        throw new Error('El email de administrador ya está registrado. Por favor usá otro email para esta tienda.');
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await tx.insert(users).values({
        id: userId,
        storeId: storeId!, // ✅ Now references existing store
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        forcePasswordChange: false, // Don't force change for setup admin
      });

      // Helper function to save config values
      const saveConfig = async (key: string, value: string) => {
        // Check if exists first (ON CONFLICT needs composite PK)
        const existing = await tx.select()
          .from(storeConfig)
          .where(eq(storeConfig.storeId, storeId!))
          .limit(100);
        
        const hasKey = existing.find(e => e.key === key);
        
        if (hasKey) {
          // Use raw SQL for composite key update
          await tx.execute(
            `UPDATE store_config SET value = '${value.replace(/'/g, "''")}', updated_at = NOW() 
             WHERE store_id = '${storeId}' AND key = '${key}'`
          );
        } else {
          await tx.insert(storeConfig).values({
            key,
            storeId: storeId!,
            value,
          });
        }
      };

      // 3. Save ALL Store Config
      await saveConfig('store_name', storeName || 'My Store');
      await saveConfig('store_domain', storeDomain || 'localhost');
      
      // Additional wizard fields
      if (tagline) await saveConfig('store_slogan', tagline);
      if (logo) await saveConfig('store_logo', logo);
      if (email) await saveConfig('store_email', email);
      if (whatsapp) await saveConfig('social_whatsapp', whatsapp);
      if (instagram) await saveConfig('social_instagram', instagram.replace('@', ''));
      if (address) await saveConfig('address_street', address);
      
      // Theme colors
      if (primaryColor) {
        await saveConfig('theme_primary', primaryColor);
        await saveConfig('theme_text', primaryColor); // Use primary for text
      }
      if (accentColor) {
        await saveConfig('theme_accent', accentColor);
        // Generate hover color (slightly darker)
        const accentHover = adjustColor(accentColor, -20);
        await saveConfig('theme_accent_hover', accentHover);
      }
      
      // Default theme values
      await saveConfig('theme_secondary', '#f5f5f5');
      await saveConfig('theme_background', '#ffffff');
      
      // 4. ACTIVATE LICENSE (Critical Step)
      if (licenseKey) {
        await saveConfig('license_key', licenseKey);
        await saveConfig('license_status', 'activated');
        await saveConfig('license_plan', licensePlan);

        // Update the license table itself
        await tx.update(licenses)
          .set({
            status: 'activated',
            storeId: storeId!,
            activatedAt: new Date(),
            lastCheckIn: new Date(),
          })
          .where(eq(licenses.serial, licenseKey));
          
        console.log(`🔑 License ${licenseKey} activated for store ${storeId}`);
      }

      // 5. Mark Setup as Completed AND Store as Configured
      await saveConfig('setup_completed', 'true');
      await saveConfig('is_configured', 'true');
      
      // 6. Send Welcome Email
      try {
        const { sendStoreCreated } = await import('../services/email.service.js');
        // Mothership URL for dashboard access
        const dashboardUrl = process.env.VITE_API_URL || 'https://tiendita.app'; 
        await sendStoreCreated(adminEmail, storeName || 'Tu Tienda', dashboardUrl);
        console.log(`📧 Welcome email sent to ${adminEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
      }
    });

    console.log('✅ Store setup completed with full configuration');

    res.json({ 
      success: true, 
      message: 'Store setup completed successfully',
      storeId,
    });

  } catch (error: any) {
    console.error('Setup Error:', error);
    // Return appropriate error message
    const message = error.message || 'Setup failed';
    res.status(400).json({ error: message });
  }
}

// Helper to darken/lighten color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export async function checkSetupStatus(req: Request, res: Response) {
  try {
    const result = await db.select().from(storeConfig).where(eq(storeConfig.key, 'setup_completed')).limit(1);
    const isCompleted = result.length > 0 && result[0].value === 'true';
    res.json({ setupCompleted: isCompleted });
  } catch (error) {
    res.status(500).json({ error: 'Error checking setup status' });
  }
}

