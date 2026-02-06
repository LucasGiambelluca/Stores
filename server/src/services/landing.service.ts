import { db } from '../db/drizzle.js';
import { landingConfig, type LandingConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class LandingService {
  static async get(): Promise<LandingConfig | null> {
    const result = await db.select().from(landingConfig).where(eq(landingConfig.id, 1)).limit(1);
    return result[0] || null;
  }

  static async update(content: any, updatedBy?: string): Promise<LandingConfig> {
    const existing = await this.get();
    
    if (existing) {
      const result = await db.update(landingConfig)
        .set({ 
          content, 
          updatedAt: new Date(),
          updatedBy 
        })
        .where(eq(landingConfig.id, 1))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(landingConfig).values({
        id: 1,
        content,
        updatedBy
      }).returning();
      return result[0];
    }
  }
}
