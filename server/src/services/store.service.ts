import { db } from '../db/drizzle.js';
import { 
  products, categories, orders, orderItems, 
  reviews, wishlist, abandonedCarts,
  stores, licenses, users,
  shipments, storeConfig, faqs, banners, addresses
} from '../db/schema.js';
import { sql, eq, desc, ilike, or, isNull, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { LicenseGenerator } from '../utils/license-generator.js';
import bcrypt from 'bcryptjs';
import { logger } from './logger.service.js';

export class StoreService {
  /**
   * Clear all store data (products, categories, orders, etc.)
   * Used when initializing a new store to ensure a clean slate.
   */
  async clearStoreData() {
    logger.info('🧹 Clearing store data...');
    
    try {
      // Delete in order of dependencies
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(reviews);
      await db.delete(wishlist);
      await db.delete(abandonedCarts);
      await db.delete(products);
      await db.delete(categories);
      
      // Note: We don't delete users/customers to avoid locking out the admin
      
      logger.info('✨ Store data cleared successfully');
    } catch (error) {
      logger.error('Error clearing store data:', { error: error as Error });
      throw new Error('Failed to clear store data');
    }
  }

  /**
   * Seed template data for a specific industry
   */
  async seedTemplateData(template: string, customCategories?: { name: string, slug: string }[], storeId?: string) {
    logger.info(`🌱 Seeding template data for: ${template}`);
    
    try {
      // Get storeId - either passed in or get first available store
      let targetStoreId = storeId;
      if (!targetStoreId) {
        const store = await db.query.stores.findFirst();
        if (!store) {
          throw new Error('No store found. Please run setup first.');
        }
        targetStoreId = store.id;
      }

      // 1. Create Categories
      const categoriesToCreate = customCategories || this.getDefaultCategories(template);
      
      for (let i = 0; i < categoriesToCreate.length; i++) {
        const cat = categoriesToCreate[i];
        await db.insert(categories).values({
          id: `cat-${uuidv4()}`,
          storeId: targetStoreId, // Add storeId
          name: cat.name,
          slug: cat.slug,
          orderNum: i + 1,
          isActive: true,
          isAccent: false,
        });
      }
      
      logger.info(`✅ Created ${categoriesToCreate.length} categories`);
      
    } catch (error) {
      logger.error('Error seeding template data:', { error: error as Error });
      throw new Error('Failed to seed template data');
    }
  }

  private getDefaultCategories(template: string): { name: string, slug: string }[] {
    switch (template) {
      case 'Ropa y Moda':
        return [
          { name: 'Remeras', slug: 'remeras' },
          { name: 'Pantalones', slug: 'pantalones' },
          { name: 'Abrigos', slug: 'abrigos' },
          { name: 'Accesorios', slug: 'accesorios' },
        ];
      case 'Electrónica':
        return [
          { name: 'Celulares', slug: 'celulares' },
          { name: 'Computadoras', slug: 'computadoras' },
          { name: 'Audio', slug: 'audio' },
          { name: 'Accesorios', slug: 'accesorios' },
        ];
      default:
        return [
          { name: 'Novedades', slug: 'novedades' },
          { name: 'Ofertas', slug: 'ofertas' },
        ];
    }
  }

  async getAllStores(page: number = 1, limit: number = 20, search?: string, status?: string, plan?: string) {
    const offset = (page - 1) * limit;

    // Get total count (excluding deleted)
    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(stores)
      .where(isNull(stores.deletedAt));
    const total = countResult[0]?.count || 0;

    // Get paginated results
    const storesList = await db.select({
      id: stores.id,
      name: stores.name,
      domain: stores.domain,
      customDomain: stores.customDomain,
      status: stores.status,
      plan: stores.plan,
      licenseKey: stores.licenseKey,
      ownerEmail: stores.ownerEmail,
      ownerName: stores.ownerName,
      createdAt: stores.createdAt,
      lastCheckIn: stores.lastCheckIn,
    })

    .from(stores)
    .where(isNull(stores.deletedAt))
    .orderBy(desc(stores.createdAt))
    .limit(limit)
    .offset(offset);

    // Get license info for each store
    const storesWithLicense = await Promise.all(
      storesList.map(async (store) => {
        let license = null;
        if (store.licenseKey) {
          const [lic] = await db.select()
            .from(licenses)
            .where(eq(licenses.serial, store.licenseKey))
            .limit(1);
          license = lic;
        }
        return { ...store, license };
      })
    );

    return {
      stores: storesWithLicense,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStoreById(id: string) {
    const [store] = await db.select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    
    if (!store) {
      throw new Error('Store not found');
    }

    if (store.deletedAt) {
      throw new Error('Store has been deleted');
    }

    // Get license info
    let license = null;
    if (store.licenseKey) {
      const [lic] = await db.select()
        .from(licenses)
        .where(eq(licenses.serial, store.licenseKey))
        .limit(1);
      license = lic;
    }

    // Get statistics
    const [productCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.storeId, id));
    
    const [orderCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(orders);
    
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.storeId, id));

    return {
      store,
      license,
      stats: {
        products: productCount?.count || 0,
        orders: orderCount?.count || 0,
        users: userCount?.count || 0,
      },
    };
  }

  async checkDomainAvailability(subdomain: string) {
    if (!subdomain) return false;
    
    // Check reserved words
    const reserved = ['www', 'api', 'admin', 'mothership', 'mail', 'smtp', 'pop', 'imap', 'ftp', 'cpanel'];
    if (reserved.includes(subdomain.toLowerCase())) return false;

    const [existing] = await db.select({ id: stores.id })
      .from(stores)
      .where(eq(stores.domain, subdomain.toLowerCase()))
      .limit(1);
    
    return !existing;
  }

  /**
   * Create a new store WITHOUT auto-generating a license.
   * Stores start with plan='none' and no license. 
   * License is assigned separately via assignLicenseToStore().
   */
  async createStore(data: { name: string, ownerEmail: string, ownerName?: string }) {
    const { name, ownerEmail, ownerName } = data;
    
    if (!name || !ownerEmail) {
      throw new Error('Name and owner email are required');
    }

    // Generate store ID and domain
    const storeId = uuidv4();
    const domain = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create store with no license - plan controlled by license
    await db.insert(stores).values({
      id: storeId,
      name,
      domain,
      status: 'pending', // Waiting for license activation
      plan: 'none',      // No plan until license assigned
      licenseKey: null,
      ownerEmail,
      ownerName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Store created: ${name} (${storeId}) - waiting for license`);

    return {
      store: {
        id: storeId,
        name,
        domain,
        status: 'pending',
        plan: 'none',
        licenseKey: null,
        ownerEmail,
        ownerName,
      },
    };
  }

  /**
   * Assign a license to a store.
   * The store inherits the plan from the license.
   */
  async assignLicenseToStore(storeId: string, licenseSerial: string) {
    // Find the store
    const [store] = await db.select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    
    if (!store) {
      throw new Error('Store not found');
    }

    // Check if store already has a license
    if (store.licenseKey) {
      throw new Error('Store already has a license assigned');
    }

    // Find the license
    const [license] = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, licenseSerial))
      .limit(1);
    
    if (!license) {
      throw new Error('License not found');
    }

    // Check license is not already assigned to another store
    if (license.storeId && license.storeId !== storeId) {
      throw new Error('License is already assigned to another store');
    }

    // Check license status
    if (license.status === 'revoked') {
      throw new Error('License has been revoked');
    }
    if (license.status === 'expired') {
      throw new Error('License has expired');
    }

    // Update license to link to store
    await db.update(licenses)
      .set({ 
        storeId,
        status: 'activated',
        activatedAt: new Date(),
      })
      .where(eq(licenses.serial, licenseSerial));

    // Update store with license info
    await db.update(stores)
      .set({
        licenseKey: licenseSerial,
        plan: license.plan,
        status: 'active', // Activate the store
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    logger.info(`✅ License ${licenseSerial} assigned to store ${store.name}`);

    return {
      store: {
        id: storeId,
        name: store.name,
        plan: license.plan,
        status: 'active',
        licenseKey: licenseSerial,
      },
      license: {
        serial: licenseSerial,
        plan: license.plan,
        expiresAt: license.expiresAt,
      },
    };
  }

  async updateStore(id: string, updates: { status?: string, plan?: string, name?: string, domain?: string }) {
    const [existing] = await db.select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    
    if (!existing) {
      throw new Error('Store not found');
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };
    
    if (updates.status) updateData.status = updates.status;
    if (updates.plan) updateData.plan = updates.plan;
    if (updates.name) updateData.name = updates.name;
    if (updates.domain) updateData.domain = updates.domain;

    await db.update(stores)
      .set(updateData)
      .where(eq(stores.id, id));

    // If suspending store, also suspend the license
    if (updates.status === 'suspended' && existing.licenseKey) {
      await db.update(licenses)
        .set({ status: 'suspended' })
        .where(eq(licenses.serial, existing.licenseKey));
    }

    // If reactivating store, also reactivate the license
    if (updates.status === 'active' && existing.licenseKey) {
      await db.update(licenses)
        .set({ status: 'activated' })
        .where(eq(licenses.serial, existing.licenseKey));
    }
  }

  async deleteStore(id: string) {
    const [existing] = await db.select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    
    if (!existing) {
      throw new Error('Store not found');
    }

    // PROTECT MOTHERSHIP
    if (existing.domain === 'mothership' || existing.name === 'Mothership Panel') {
      throw new Error('Cannot delete the Mothership Panel store.');
    }

    // Revoke license if exists
    if (existing.licenseKey) {
      await db.update(licenses)
        .set({ status: 'revoked' })
        .where(eq(licenses.serial, existing.licenseKey));
    }

    // SOFT DELETE: Mark store as deleted instead of removing data
    logger.info(`🗑️ Soft deleting store ${id}...`);
    
    await db.update(stores)
      .set({ 
        deletedAt: new Date(),
        status: 'deleted', // Update status to reflect deletion
        updatedAt: new Date()
      })
      .where(eq(stores.id, id));

    logger.info(`✅ Store ${id} soft deleted (archived)`);
  }

  async getStoreStats(id: string) {
    const [productCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.storeId, id));
    
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.storeId, id));

    return {
      storeId: id,
      stats: {
        products: productCount?.count || 0,
        users: userCount?.count || 0,
      },
    };
  }

  async getStoreAdmins(id: string) {
    const admins = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.storeId, id))
    .orderBy(desc(users.createdAt));

    return admins;
  }

  async resetAdminPassword(storeId: string, data: { userId?: string, email?: string, newPassword?: string }) {
    const { userId, email, newPassword } = data;
    
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Find user by ID or email within the store
    let user;
    if (userId) {
      const [u] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      user = u;
    } else if (email) {
      const [u] = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      user = u;
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Verify user belongs to this store
    if (user.storeId !== storeId) {
      logger.error(`[ResetPassword] Mismatch: User storeId (${user.storeId}) !== Request storeId (${storeId})`);
      throw new Error('User does not belong to this store');
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ 
        password: hashedPassword,
        forcePasswordChange: true, // Force them to change on next login
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info(`🔐 Password reset for user ${user.email} by super admin`);

    return { 
      email: user.email,
    };
  }

  async bulkDeleteStores(ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Array of store IDs is required');
    }
    
    let deletedCount = 0;
    const errors: string[] = [];
    
    for (const id of ids) {
      try {
        await this.deleteStore(id);
        deletedCount++;
      } catch (err) {
        errors.push(`Failed to delete store ${id}`);
      }
    }
    
    return { 
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  async getGlobalStats() {
    // 1. Store Stats
    const [totalStores] = await db.select({ count: sql<number>`count(*)::int` })
      .from(stores)
      .where(isNull(stores.deletedAt));
    
    const [activeStores] = await db.select({ count: sql<number>`count(*)::int` })
      .from(stores)
      .where(and(
        isNull(stores.deletedAt),
        eq(stores.status, 'active')
      ));

    // 2. License Stats
    const [totalLicenses] = await db.select({ count: sql<number>`count(*)::int` })
      .from(licenses);
    
    const [activeLicenses] = await db.select({ count: sql<number>`count(*)::int` })
      .from(licenses)
      .where(eq(licenses.status, 'activated'));

    // 3. Traffic/Activity Stats (Global)
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'customer'));
    
    const [totalOrders] = await db.select({ count: sql<number>`count(*)::int` })
      .from(orders);

    // 4. Historical Data (Real Aggregation)
    
    // Orders History (Last 30 days) - using raw SQL for date_trunc compatibility
    const ordersHistoryResult = await db.execute(sql`
      SELECT 
        date_trunc('day', created_at) as date, 
        count(*)::int as count 
      FROM orders
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY date 
      ORDER BY date ASC
    `);

    const ordersHistory = ordersHistoryResult.map((row: any) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      count: row.count,
    }));

    // Stores History (Last 6 months) - using raw SQL for date_trunc compatibility
    const storesHistoryResult = await db.execute(sql`
      SELECT 
        date_trunc('month', created_at) as date, 
        count(*)::int as count 
      FROM stores
      WHERE created_at > NOW() - INTERVAL '6 months'
        AND deleted_at IS NULL
      GROUP BY date 
      ORDER BY date ASC
    `);

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const storesHistory = storesHistoryResult.map((row: any) => {
      const date = new Date(row.date);
      return {
        name: monthNames[date.getMonth()],
        count: row.count,
      };
    });

    return {
      stores: {
        total: totalStores?.count || 0,
        active: activeStores?.count || 0,
      },
      licenses: {
        total: totalLicenses?.count || 0,
        active: activeLicenses?.count || 0,
      },
      activity: {
        totalCustomers: totalCustomers?.count || 0,
        totalOrders: totalOrders?.count || 0,
      },
      history: {
        orders: ordersHistory,
        stores: storesHistory,
      }
    };
  }
}

export const storeService = new StoreService();
