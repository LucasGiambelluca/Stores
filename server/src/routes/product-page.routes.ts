/**
 * Product Page Builder Routes
 * 
 * CRUD endpoints for product page configuration per store.
 * Includes plan-based validation for widget access.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { db } from '../db/index.js';
import { productPageConfig, stores } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';


const router: Router = Router();

// NOTE: GET is public (for storefront), PUT/DELETE require authentication

// Plan hierarchy for validation
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

// Widget plan requirements
const WIDGET_PLAN_REQUIREMENTS: Record<string, string> = {
  'product-gallery': 'free',
  'product-info': 'free',
  'product-buy-box': 'free',
  'product-description': 'free',
  'product-reviews': 'starter',
  'related-products': 'starter',
  'product-specs': 'starter',
  'product-banner': 'pro',
  'product-countdown': 'pro',
  'product-size-guide': 'pro',
  'product-video': 'enterprise',
  'product-custom-html': 'enterprise',
  'product-3d-viewer': 'enterprise',
};

// Default column for each widget type (used when syncing layout)
const DEFAULT_WIDGET_COLUMNS: Record<string, 'leftColumn' | 'rightColumn' | 'fullWidth'> = {
  'product-gallery': 'leftColumn',
  'product-info': 'rightColumn',
  'product-buy-box': 'rightColumn',
  'product-description': 'rightColumn',
  'product-countdown': 'rightColumn',
  'product-size-guide': 'rightColumn',
  'product-banner': 'rightColumn',
  'product-reviews': 'fullWidth',
  'related-products': 'fullWidth',
  'product-specs': 'fullWidth',
  'product-video': 'fullWidth',
  'product-bundles': 'fullWidth',
  'product-cross-sell': 'fullWidth',
  'product-custom-html': 'fullWidth',
  'product-3d-viewer': 'fullWidth',
};

/**
 * Sync layout config with blocks array
 * - Ensures every block type is in exactly one column
 * - Removes widget types that no longer exist in blocks
 * - Adds missing widget types to their default column
 */
function syncLayoutWithBlocks(
  blocks: Array<{ type: string; isActive?: boolean }>,
  layoutConfig: { gridType?: string; leftColumn?: string[]; rightColumn?: string[]; fullWidth?: string[] } | null
): { gridType: 'classic' | 'full-width' | 'gallery-left' | 'gallery-right'; leftColumn: string[]; rightColumn: string[]; fullWidth: string[] } {
  // Valid grid types
  const validGridTypes = ['classic', 'full-width', 'gallery-left', 'gallery-right'] as const;
  const inputGridType = layoutConfig?.gridType;
  const gridType = (inputGridType && validGridTypes.includes(inputGridType as any)) 
    ? inputGridType as 'classic' | 'full-width' | 'gallery-left' | 'gallery-right'
    : 'classic';
  
  // Start with existing layout or defaults
  const synced = {
    gridType,
    leftColumn: [...(layoutConfig?.leftColumn || [])],
    rightColumn: [...(layoutConfig?.rightColumn || [])],
    fullWidth: [...(layoutConfig?.fullWidth || [])],
  };
  
  // Get all block types from the blocks array
  const blockTypes = new Set(blocks.map(b => b.type));
  
  // Get all types currently in any column
  const allLayoutTypes = new Set([
    ...synced.leftColumn,
    ...synced.rightColumn,
    ...synced.fullWidth,
  ]);
  
  // 1. Remove from layout any types that don't exist in blocks
  synced.leftColumn = synced.leftColumn.filter(t => blockTypes.has(t));
  synced.rightColumn = synced.rightColumn.filter(t => blockTypes.has(t));
  synced.fullWidth = synced.fullWidth.filter(t => blockTypes.has(t));
  
  // 2. Add missing block types to their default column
  for (const type of blockTypes) {
    const isInLayout = 
      synced.leftColumn.includes(type) ||
      synced.rightColumn.includes(type) ||
      synced.fullWidth.includes(type);
    
    if (!isInLayout) {
      const defaultColumn = DEFAULT_WIDGET_COLUMNS[type] || 'fullWidth';
      synced[defaultColumn].push(type);
    }
  }
  
  return synced;
}

/**
 * GET /api/product-page-config
 * Get product page configuration for the current store
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId || (req.user as any)?.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const config = await db.query.productPageConfig.findFirst({
      where: eq(productPageConfig.storeId, storeId),
    });

    if (!config) {
      return res.json({
        id: null,
        storeId,
        blocks: getDefaultBlocks(),
        globalStyles: {},
        isEnabled: false,
      });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/product-page-config
 * Create or update product page configuration
 * Requires admin role
 */
router.put('/', authMiddleware, requireRole(['admin', 'super_admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId || req.user?.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    const { blocks, globalStyles, layoutConfig, isEnabled } = req.body;

    // Get store plan for validation
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const storePlan = store.plan || 'free';

    // Validate blocks against plan
    if (blocks && Array.isArray(blocks)) {
      for (const block of blocks) {
        const requiredPlan = WIDGET_PLAN_REQUIREMENTS[block.type] || 'free';
        const hasAccess = PLAN_HIERARCHY[storePlan] >= PLAN_HIERARCHY[requiredPlan];
        
        if (!hasAccess && block.isActive) {
          return res.status(403).json({
            error: `Widget "${block.type}" requires plan "${requiredPlan}" or higher`,
            currentPlan: storePlan,
            requiredPlan,
          });
        }
      }
    }

    // Validate globalStyles against plan (Pro+)
    if (globalStyles && Object.keys(globalStyles).length > 0) {
      if (PLAN_HIERARCHY[storePlan] < PLAN_HIERARCHY['pro']) {
        return res.status(403).json({
          error: 'Custom styling requires Pro plan or higher',
          currentPlan: storePlan,
        });
      }
    }

    // Check if config exists
    const existingConfig = await db.query.productPageConfig.findFirst({
      where: eq(productPageConfig.storeId, storeId),
    });

    // Determine the final blocks to use
    const finalBlocks = blocks || existingConfig?.blocks || getDefaultBlocks();
    
    // Sync layout with blocks - this ensures no orphaned widgets
    const baseLayout = layoutConfig || existingConfig?.layoutConfig || null;
    const syncedLayout = syncLayoutWithBlocks(finalBlocks, baseLayout);

    if (existingConfig) {
      // Update existing
      await db.update(productPageConfig)
        .set({
          blocks: finalBlocks,
          globalStyles: globalStyles || existingConfig.globalStyles,
          layoutConfig: syncedLayout,
          isEnabled: isEnabled ?? existingConfig.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(productPageConfig.storeId, storeId));
    } else {
      // Insert new
      await db.insert(productPageConfig).values({
        id: uuidv4(),
        storeId,
        blocks: finalBlocks,
        globalStyles: globalStyles || {},
        layoutConfig: syncedLayout,
        isEnabled: isEnabled ?? false,
      });
    }

    // Fetch and return updated config
    const updatedConfig = await db.query.productPageConfig.findFirst({
      where: eq(productPageConfig.storeId, storeId),
    });

    res.json(updatedConfig);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/product-page-config
 * Reset product page configuration to defaults
 * Requires admin role
 */
router.delete('/', authMiddleware, requireRole(['admin', 'super_admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId || req.user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    await db.delete(productPageConfig)
      .where(eq(productPageConfig.storeId, storeId));

    res.json({ message: 'Product page configuration reset to defaults' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/product-page-config/available-widgets
 * Get list of widgets available for the current store's plan
 */
router.get('/available-widgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId || req.user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID required' });
    }

    // Get store plan
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });

    const storePlan = store?.plan || 'free';
    const storePlanLevel = PLAN_HIERARCHY[storePlan];

    // Build widget availability list
    const widgets = Object.entries(WIDGET_PLAN_REQUIREMENTS).map(([type, requiredPlan]) => ({
      type,
      requiredPlan,
      isAvailable: storePlanLevel >= PLAN_HIERARCHY[requiredPlan],
    }));

    res.json({
      storePlan,
      widgets,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Default blocks for new stores
 */
function getDefaultBlocks() {
  return [
    {
      id: 'default-gallery',
      type: 'product-gallery',
      order: 1,
      isActive: true,
      requiredPlan: 'free',
      config: { layout: 'carousel', showThumbnails: true },
    },
    {
      id: 'default-info',
      type: 'product-info',
      order: 2,
      isActive: true,
      requiredPlan: 'free',
      config: { showCategory: true, showRating: true },
    },
    {
      id: 'default-buybox',
      type: 'product-buy-box',
      order: 3,
      isActive: true,
      requiredPlan: 'free',
      config: { buttonStyle: 'solid' },
    },
    {
      id: 'default-description',
      type: 'product-description',
      order: 4,
      isActive: true,
      requiredPlan: 'free',
      config: { showTitle: true },
    },
    {
      id: 'default-related',
      type: 'related-products',
      order: 5,
      isActive: true,
      requiredPlan: 'starter',
      config: { limit: 4, layout: 'grid' },
    },
  ];
}

export default router;
