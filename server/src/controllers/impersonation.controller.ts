import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/drizzle.js';
import { stores, auditLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { env } from '../env.js';

/**
 * Generate a short-lived impersonation token for accessing a store as admin
 * Only super_admins can call this endpoint
 */
export const generateImpersonationToken = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.body;
    const superAdmin = req.user; // Set by auth middleware
    
    // Verify user is authenticated
    if (!superAdmin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify caller is super_admin
    if (superAdmin.role !== 'admin') { // Changed from 'super_admin' to 'admin' to match schema
      return res.status(403).json({ error: 'Only super admins can impersonate' });
    }
    
    // Verify store exists
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId)
    });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Generate short-lived token (5 minutes)
    const impersonationToken = jwt.sign(
      {
        userId: `impersonate-${superAdmin.id}`,
        email: superAdmin.email,
        role: 'admin', // Impersonate as store admin
        storeId: storeId,
        isImpersonation: true,
        impersonatedBy: superAdmin.id
      },
      env.JWT_SECRET, // Use validated env instead of process.env
      { expiresIn: '5m' } // 5 minutes only
    );
    
    // Audit log - Track impersonation actions
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: 'IMPERSONATE_STORE',
        userId: superAdmin.id,
        userEmail: superAdmin.email,
        targetId: storeId,
        targetType: 'store',
        details: JSON.stringify({
          storeName: store.name,
          storeDomain: store.domain,
          timestamp: new Date().toISOString()
        }),
        createdAt: new Date()
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Continue even if audit fails
    }
    
    res.json({
      impersonationToken,
      storeId,
      storeName: store.name,
      storeDomain: store.domain,
      expiresIn: '5m'
    });
    
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ error: 'Failed to generate impersonation token' });
  }
};


/**
 * List all stores (for Mothership dashboard)
 * Only super_admins can call this
 */
export const listStores = async (req: Request, res: Response) => {
  try {
    const superAdmin = req.user;
    
    // Verify user is authenticated
    if (!superAdmin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (superAdmin.role !== 'admin') { // Changed from 'super_admin' to 'admin'
      return res.status(403).json({ error: 'Only super admins can list stores' });
    }
    
    const allStores = await db.query.stores.findMany({
      orderBy: (storesTable, { desc }) => [desc(storesTable.createdAt)]
    });
    
    res.json({ stores: allStores });
    
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ error: 'Failed to list stores' });
  }
};

/**
 * Get store details
 */
export const getStore = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const user = req.user;
    
    // Verify user is authenticated
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Users can only see their own store, super_admins can see all
    if (user.role !== 'admin' && user.storeId !== storeId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId)
    });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json({ store });
    
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to get store' });
  }
};

