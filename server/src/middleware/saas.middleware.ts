import { Request, Response, NextFunction } from 'express';
import { SaasClient } from '../services/saas.client.js';
import { db, storeConfig } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';

export const saasMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Allow access to setup, central, and static files
  // Allow access to setup, central, and static files
  if (req.originalUrl.startsWith('/api/setup') || 
      req.originalUrl.startsWith('/api/central') ||
      req.originalUrl.startsWith('/api/saas') || // Allow SaaS management endpoints
      req.originalUrl.startsWith('/api/auth') || // Allow login/recovery even if suspended
      req.method === 'OPTIONS') {
    return next();
  }

  try {
    // First check if setup is completed
    const setupResult = await db.select().from(storeConfig).where(eq(storeConfig.key, 'setup_completed')).limit(1);
    const isSetupCompleted = setupResult.length > 0 && setupResult[0].value === 'true';
    
    // If setup is not completed, allow all access
    if (!isSetupCompleted) {
      return next();
    }
    
    // After setup is complete, check SaaS status
    const status = await SaasClient.checkStatus();
    
    if (status.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Store Suspended', 
        message: 'This store has been suspended. Please contact support.',
        code: 'STORE_SUSPENDED'
      });
    }

    if (status.status === 'inactive') {
      // Allow read-only access or redirect to setup?
      // For now, we allow it if setup is done (trial mode)
      return next();
    }

    next();
  } catch (error) {
    console.error('SaaS Middleware Error:', error);
    // Fail open to allow access if middleware has errors
    next();
  }
};
