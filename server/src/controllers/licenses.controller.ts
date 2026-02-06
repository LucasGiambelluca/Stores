import { Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { licenses } from '../db/schema.js';
import { eq, desc, and, or, like, sql, type SQL } from 'drizzle-orm';
import { LicenseGenerator } from '../utils/license-generator.js';
import { sendActivationLicense } from '../services/email.service.js';

// Inline types to avoid rootDir issues with shared module
interface CreateLicenseInput {
  plan: 'trial' | 'free' | 'starter' | 'pro' | 'enterprise';
  duration: 'lifetime' | '1year' | '6months' | '3months' | '1week';
  ownerEmail?: string;
  ownerName?: string;
  notes?: string;
}

interface UpdateLicenseInput {
  action: 'suspend' | 'activate' | 'revoke' | 'renew';
  duration?: string;
  notes?: string;
}

/**
 * CREATE - Generate new license
 */
export async function createLicense(req: Request, res: Response) {
  try {
    console.log('📝 Creating license - Request body:', req.body);
    const { plan, duration, ownerEmail, ownerName, notes }: CreateLicenseInput = req.body;
    
    // Validation
    if (!plan || !duration) {
      console.log('❌ Validation failed:', { plan, duration });
      return res.status(400).json({ error: 'Plan and duration are required' });
    }
    
    console.log('✅ Validation passed');
    
    // Generate unique serial
    let serial: string = '';
    let exists = true;
    let attempts = 0;
    
    while (exists && attempts < 10) {
      serial = LicenseGenerator.generate();
      console.log(`🔄 Attempt ${attempts + 1}: Generated serial ${serial}`);
      const check = await db.select().from(licenses).where(eq(licenses.serial, serial!)).limit(1);
      exists = check.length > 0;
      attempts++;
    }
    
    if (exists) {
      console.log('❌ Failed to generate unique serial after 10 attempts');
      return res.status(500).json({ error: 'Failed to generate unique serial' });
    }
    
    console.log(`✅ Serial generated: ${serial}`);
    
    // Calculate expiration
    const expiresAt = LicenseGenerator.getExpirationDate(duration);
    console.log('📅 Expiration date:', expiresAt);
    
    // Get plan limits
    const limits = LicenseGenerator.getPlanLimits(plan);
    console.log('📊 Plan limits:', limits);
    
    // Prepare data
    const licenseData = {
      serial: serial,
      plan,
      status: 'generated' as const,
      storeId: null,
      expiresAt,
      maxProducts: limits.maxProducts,
      maxOrders: limits.maxOrders,
      ownerEmail: ownerEmail || null,
      ownerName: ownerName || null,
      notes: notes || null,
    };
    
    console.log('💾 Inserting license data:', licenseData);
    
    // Create license
    const [newLicense] = await db.insert(licenses).values(licenseData).returning();
    
    console.log('✅ License created successfully:', newLicense);
    
    // Send email if ownerEmail provided
    if (ownerEmail) {
      try {
        await sendActivationLicense(ownerEmail, serial, plan);
        console.log(`📧 License email sent to ${ownerEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send license email:', emailError);
        // We don't fail the request if email fails, just log it
      }
    }
    
    res.status(201).json({
      success: true,
      license: newLicense,
    });
  } catch (error) {
    console.error('❌ Create license error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack: 'No stack');
    res.status(500).json({ 
      error: 'Failed to create license',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * READ - Get all licenses with filters
 */
export async function getLicenses(req: Request, res: Response) {
  try {
    const { status, plan, search } = req.query;
    
    // Build filter conditions
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(licenses.status, status as string));
    if (plan) conditions.push(eq(licenses.plan, plan as string));
    if (search) {
      const searchCondition = or(
        like(licenses.serial, `%${search}%`),
        like(licenses.ownerEmail, `%${search}%`),
        like(licenses.ownerName, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    
    // Execute query with optional filters
    const results = conditions.length > 0
      ? await db.select().from(licenses).where(and(...conditions)).orderBy(desc(licenses.createdAt))
      : await db.select().from(licenses).orderBy(desc(licenses.createdAt));
    
    res.json({ licenses: results });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
}

/**
 * READ - Get single license by serial
 */
export async function getLicense(req: Request, res: Response) {
  try {
    const { serial } = req.params;
    
    const result = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, serial))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    res.json({ license: result[0] });
  } catch (error) {
    console.error('Get license error:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
}

/**
 * UPDATE - Modify license (suspend, activate, renew, revoke)
 */
export async function updateLicense(req: Request, res: Response) {
  try {
    const { serial } = req.params;
    const { action, duration, notes }: UpdateLicenseInput = req.body;
    
    const updates: any = {};
    
    switch (action) {
      case 'suspend':
        updates.status = 'suspended';
        break;
      case 'activate':
        updates.status = 'activated';
        break;
      case 'revoke':
        updates.status = 'revoked';
        break;
      case 'renew':
        if (!duration) {
          return res.status(400).json({ error: 'Duration required for renewal' });
        }
        updates.expiresAt = LicenseGenerator.getExpirationDate(duration);
        updates.status = 'activated';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    if (notes !== undefined) updates.notes = notes;
    
    await db.update(licenses)
      .set(updates)
      .where(eq(licenses.serial, serial));
    
    res.json({ success: true, message: `License ${action}d successfully` });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
}

/**
 * DELETE - Remove license
 */
export async function deleteLicense(req: Request, res: Response) {
  try {
    const { serial } = req.params;
    
    // Check if license is associated with an active store
    const result = await db.select()
      .from(licenses)
      .where(eq(licenses.serial, serial))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    if (result[0].storeId && result[0].status === 'activated') {
      return res.status(400).json({ 
        error: 'Cannot delete activated license. Revoke it first.' 
      });
    }
    
    await db.delete(licenses).where(eq(licenses.serial, serial));
    
    res.json({ success: true, message: 'License deleted successfully' });
  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
}

/**
 * STATS - Get license statistics
 */
export async function getLicenseStats(req: Request, res: Response) {
  try {
    // Get counts by status
    const stats = await db.select({
      status: licenses.status,
      count: sql<number>`count(*)::int`,
    })
    .from(licenses)
    .groupBy(licenses.status);
    
    // Transform to object
    const statsObj: any = {
      total: 0,
      generated: 0,
      activated: 0,
      suspended: 0,
      expired: 0,
      revoked: 0,
    };
    
    stats.forEach((stat) => {
      statsObj[stat.status] = stat.count;
      statsObj.total += stat.count;
    });
    
    res.json({ stats: statsObj });
  } catch (error) {
    console.error('Get license stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

/**
 * BULK DELETE - Remove multiple licenses
 */
export async function bulkDeleteLicenses(req: Request, res: Response) {
  try {
    const { serials }: { serials: string[] } = req.body;
    
    if (!serials || !Array.isArray(serials) || serials.length === 0) {
      return res.status(400).json({ error: 'Array of serials is required' });
    }
    
    // Check for activated licenses
    const activatedLicenses = await db.select()
      .from(licenses)
      .where(and(
        sql`${licenses.serial} IN (${sql.join(serials.map(s => sql`${s}`), sql`, `)})`,
        eq(licenses.status, 'activated'),
        sql`${licenses.storeId} IS NOT NULL`
      ));
    
    if (activatedLicenses.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete ${activatedLicenses.length} activated license(s). Revoke them first.`,
        activatedSerials: activatedLicenses.map(l => l.serial)
      });
    }
    
    // Delete all licenses
    let deletedCount = 0;
    for (const serial of serials) {
      const result = await db.delete(licenses).where(eq(licenses.serial, serial));
      deletedCount++;
    }
    
    res.json({ 
      success: true, 
      message: `${deletedCount} license(s) deleted successfully`,
      deletedCount 
    });
  } catch (error) {
    console.error('Bulk delete licenses error:', error);
    res.status(500).json({ error: 'Failed to delete licenses' });
  }
}

