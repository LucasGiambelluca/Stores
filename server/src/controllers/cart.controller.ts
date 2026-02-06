import { Request, Response } from 'express';
import { db, abandonedCarts } from '../db/drizzle.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function saveCart(req: Request, res: Response) {
  try {
    const storeId = (req as any).storeId;
    const { email, items, total, sessionId } = req.body;

    if (!storeId) return res.status(400).json({ error: 'Store context required' });
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

    // If no email and no sessionId, we can't track it effectively for recovery
    if (!email && !sessionId) {
      return res.status(200).json({ message: 'Skipped (no identifier)' });
    }

    // Check if cart exists for this session/email
    // Priority: Email > Session
    let existingCart;
    
    if (email) {
      [existingCart] = await db.select().from(abandonedCarts)
        .where(and(
          eq(abandonedCarts.storeId, storeId), 
          eq(abandonedCarts.email, email), 
          eq(abandonedCarts.recovered, false)
        ))
        .limit(1);
    } else if (sessionId) {
      [existingCart] = await db.select().from(abandonedCarts)
        .where(and(
          eq(abandonedCarts.storeId, storeId), 
          eq(abandonedCarts.sessionId, sessionId), 
          eq(abandonedCarts.recovered, false)
        ))
        .limit(1);
    }

    const cartDataString = JSON.stringify({ items, total });

    if (existingCart) {
      // Update existing
      await db.update(abandonedCarts)
        .set({
          cartData: cartDataString,
          email: email || existingCart.email, // Update email if provided
          updatedAt: new Date(),
        })
        .where(eq(abandonedCarts.id, existingCart.id));
    } else {
      // Create new
      await db.insert(abandonedCarts).values({
        id: uuidv4(),
        storeId,
        sessionId,
        email,
        cartData: cartDataString,
        recovered: false,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save cart error:', error);
    res.status(500).json({ error: 'Error saving cart' });
  }
}
