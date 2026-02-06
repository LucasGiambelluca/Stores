// Audit Log Service - Track critical actions (PostgreSQL version)
import { db, sql } from '../db/drizzle.js';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';

export type AuditAction = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'order_created'
  | 'order_status_changed'
  | 'receipt_approved'
  | 'receipt_rejected'
  | 'shipment_created'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'admin_action';

interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Initialize audit_logs table
export async function initAuditTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        target_id TEXT,
        target_type TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        country_code TEXT,
        city TEXT,
        latitude DECIMAL,
        longitude DECIMAL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create indexes for faster queries
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at)`;
    
    // Add columns if they don't exist (migration)
    try {
      await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS country_code TEXT`;
      await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS city TEXT`;
      await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS latitude DECIMAL`;
      await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS longitude DECIMAL`;
    } catch (e) {
      // Ignore if columns exist
    }

  } catch (e) {
    // Table/index already exists
    console.log('Audit table ready');
  }
}

// Log an audit event
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    let geo = null;
    if (entry.ipAddress && entry.ipAddress !== 'unknown' && entry.ipAddress !== '127.0.0.1' && entry.ipAddress !== '::1') {
      geo = geoip.lookup(entry.ipAddress);
    }

    // Mock geo for localhost testing if needed, or just leave null
    if ((entry.ipAddress === '127.0.0.1' || entry.ipAddress === '::1') && process.env.NODE_ENV === 'development') {
       // Mock location (Buenos Aires) for dev visualization
       geo = { country: 'AR', city: 'Buenos Aires', ll: [-34.6037, -58.3816] } as any;
    }

    await sql`
      INSERT INTO audit_logs (
        id, action, user_id, user_email, target_id, target_type, details, 
        ip_address, user_agent, country_code, city, latitude, longitude
      )
      VALUES (
        ${uuidv4()}, ${entry.action}, ${entry.userId || null}, ${entry.userEmail || null}, 
        ${entry.targetId || null}, ${entry.targetType || null}, ${entry.details || null}, 
        ${entry.ipAddress || null}, ${entry.userAgent || null},
        ${geo?.country || null}, ${geo?.city || null}, ${geo?.ll?.[0] || null}, ${geo?.ll?.[1] || null}
      )
    `;
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// Get audit logs with filters (for admin panel)
export async function getAuditLogs(options: {
  action?: AuditAction;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    // Use postgres.js dynamic query building
    // We can't just concat sql`` fragments like strings
    
    if (options.action && options.userId) {
      return await sql`
        SELECT * FROM audit_logs 
        WHERE action = ${options.action} AND user_id = ${options.userId}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (options.action) {
      return await sql`
        SELECT * FROM audit_logs 
        WHERE action = ${options.action}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (options.userId) {
      return await sql`
        SELECT * FROM audit_logs 
        WHERE user_id = ${options.userId}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      return await sql`
        SELECT * FROM audit_logs 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

// Helper to extract IP and user agent from request
export function getRequestInfo(req: any): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}

export default {
  initAuditTable,
  logAudit,
  getAuditLogs,
  getRequestInfo,
};
