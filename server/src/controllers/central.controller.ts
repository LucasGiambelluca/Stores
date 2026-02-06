import { Request, Response } from 'express';
import { db, saasSettings, users } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// --- MOCK MOTHERSHIP CONTROLLER ---
// In a real SaaS, this would be a separate microservice.
// Here it runs on the same DB but simulates external control.

// 1. Validate / Heartbeat
export async function validateLicense(req: Request, res: Response) {
  // In real world, this receives a request from the store
  // Here we just return the status from the DB to simulate "checking"
  try {
    const settings = await db.select().from(saasSettings).limit(1);
    if (settings.length === 0) {
      return res.json({ status: 'inactive' });
    }
    
    // Update check-in time
    await db.update(saasSettings)
      .set({ lastCheckIn: new Date() })
      .where(eq(saasSettings.id, settings[0].id));

    res.json({ status: settings[0].status });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
}

// 2. Receive Logs
export async function receiveLog(req: Request, res: Response) {
  console.log('📡 [MOTHERSHIP] Received Error Log:', req.body);
  res.sendStatus(200);
}

// 3. Super Admin: Suspend/Activate Store
export async function setStoreStatus(req: Request, res: Response) {
  try {
    const { status } = req.body; // 'active' | 'suspended'
    
    // Update the single record we have
    // In a multi-tenant DB, we would filter by licenseKey
    const settings = await db.select().from(saasSettings).limit(1);
    if (settings.length > 0) {
      await db.update(saasSettings)
        .set({ status })
        .where(eq(saasSettings.id, settings[0].id));
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set status' });
  }
}

// 4. Super Admin: Remote Password Reset
export async function remoteResetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body;
    
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ 
        password: hashedPassword,
        forcePasswordChange: true // Force them to change it again for security
      })
      .where(eq(users.email, email));

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed' });
  }
}
