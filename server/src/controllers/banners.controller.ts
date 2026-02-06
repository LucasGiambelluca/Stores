import { Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { banners } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Get all banners for the current store
export const getBanners = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    console.log('[BannersController] saveBanners storeId:', storeId);
    console.log('[BannersController] saveBanners body:', JSON.stringify(req.body));
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const storeBanners = await db
      .select()
      .from(banners)
      .where(eq(banners.storeId, storeId))
      .orderBy(banners.orderNum);

    res.json({ banners: storeBanners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

// Save all banners for the current store (bulk update)
export const saveBanners = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    console.log('[BannersController] getBanners storeId:', storeId);
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const { banners: bannerData } = req.body;
    
    if (!Array.isArray(bannerData)) {
      return res.status(400).json({ error: 'Banners must be an array' });
    }

    // Delete existing banners for this store
    await db
      .delete(banners)
      .where(eq(banners.storeId, storeId));

    // Insert new banners
    if (bannerData.length > 0) {
      const bannersToInsert = bannerData.map((banner: any, index: number) => ({
        id: banner.id || uuidv4(),
        storeId,
        image: banner.image || '',
        title: banner.title || null,
        subtitle: banner.subtitle || null,
        buttonText: banner.buttonText || null,
        buttonLink: banner.buttonLink || null,
        orderNum: banner.order ?? index,
        isActive: banner.isActive ?? true,
      }));

      await db.insert(banners).values(bannersToInsert);
    }

    res.json({ success: true, message: 'Banners saved' });
  } catch (error) {
    console.error('Error saving banners:', error);
    res.status(500).json({ error: 'Failed to save banners' });
  }
};

// Create a single banner
export const createBanner = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const { image, title, subtitle, buttonText, buttonLink, order, isActive } = req.body;

    const newBanner = {
      id: uuidv4(),
      storeId,
      image: image || '',
      title: title || null,
      subtitle: subtitle || null,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      orderNum: order ?? 0,
      isActive: isActive ?? true,
    };

    await db.insert(banners).values(newBanner);

    res.status(201).json({ banner: newBanner });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
};

// Update a banner
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const { image, title, subtitle, buttonText, buttonLink, order, isActive } = req.body;

    await db
      .update(banners)
      .set({
        image,
        title,
        subtitle,
        buttonText,
        buttonLink,
        orderNum: order,
        isActive,
      })
      .where(and(eq(banners.id, id), eq(banners.storeId, storeId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
};

// Delete a banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    await db
      .delete(banners)
      .where(and(eq(banners.id, id), eq(banners.storeId, storeId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};
