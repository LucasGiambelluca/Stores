import { Request, Response } from 'express';
import { ProductsService, type ProductBody } from '../services/products.service.js';
import { cache, cacheKeys, cacheTTL } from '../services/cache.service.js';

// Get all products (public) - with caching
export async function getAllProducts(req: Request, res: Response) {
  try {
    const { category, subcategory, limit, offset } = req.query;
    const storeId = req.storeId; // From storeResolver middleware
    const hasFilters = category || subcategory || limit || offset;

    // Check cache for unfiltered requests
    if (!hasFilters && storeId) {
      const cached = cache.get(cacheKeys.products(storeId));
      if (cached) {
        return res.json(cached);
      }
    }

    const result = await ProductsService.findAll(storeId, {
      category: category as string,
      subcategory: subcategory as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    
    // Cache unfiltered product lists for 2 minutes
    if (!hasFilters && storeId) {
      cache.set(cacheKeys.products(storeId), result, cacheTTL.MEDIUM);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

// Get single product (supports direct links without storeId context)
export async function getProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Search by ID - with store isolation if storeId is available, without if not
    // This allows direct product links to work
    const product = await ProductsService.findById(id, req.storeId);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Return product WITH storeId so client can auto-detect the store
    res.json({ 
      product,
      storeId: product.storeId // Explicit storeId for client auto-detection
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const body: ProductBody = req.body;

    if (!body.name || body.price === undefined || body.price === null) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Get storeId from request context (header) or fallback to user's store
    // This fixes the issue where products are created in the wrong store if user has multiple stores
    const targetStoreId = req.storeId || (req as any).user?.storeId;
    
    if (!targetStoreId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Security check: Ensure user has permission for this store
    const user = (req as any).user;
    if (user.role !== 'super_admin' && targetStoreId !== user.storeId) {
      console.warn(`[Security] User ${user.id} attempted to create product in store ${targetStoreId} without permission`);
      return res.status(403).json({ error: 'No tienes permiso para crear productos en esta tienda' });
    }

    const product = await ProductsService.create(targetStoreId, body);

    res.status(201).json({ 
      message: 'Producto creado',
      product
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    // Handle specific license errors
    if (error.message?.includes('PRODUCT_LIMIT_EXCEEDED')) {
      return res.status(403).json({ 
        error: 'Límite de productos alcanzado',
        message: error.message.split(': ')[1]
      });
    }
    if (error.message?.includes('NO_LICENSE')) {
      return res.status(403).json({ error: 'Licencia no válida' });
    }

    res.status(500).json({ error: 'Error al crear producto' });
  }
}

// Update product (admin)
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body: ProductBody = req.body;
    
    // Get storeId from request context (header) or fallback to user's store
    const targetStoreId = req.storeId || (req as any).user?.storeId;
    
    if (!targetStoreId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Security check
    const user = (req as any).user;
    if (user.role !== 'super_admin' && targetStoreId !== user.storeId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar productos en esta tienda' });
    }

    const updated = await ProductsService.update(id, body, targetStoreId);
    
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

// Delete product (admin)
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get storeId from request context (header) or fallback to user's store
    const targetStoreId = req.storeId || (req as any).user?.storeId;
    
    if (!targetStoreId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Security check
    const user = (req as any).user;
    if (user.role !== 'super_admin' && targetStoreId !== user.storeId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar productos en esta tienda' });
    }

    const deleted = await ProductsService.delete(id, targetStoreId);

    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
}

// Update stock (internal use)
export async function updateStock(productId: string, quantity: number): Promise<boolean> {
  return ProductsService.updateStock(productId, quantity);
}

/**
 * Batch update stock for multiple products in a single query
 */
export async function batchUpdateStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
  return ProductsService.batchUpdateStock(items);
}

/**
 * Check stock availability for multiple products
 */
export async function checkStock(items: { productId: string; quantity: number }[]): Promise<{ valid: boolean; errors: string[] }> {
  return ProductsService.checkStock(items);
}

/**
 * Check stock endpoint (public - for cart validation)
 */
export async function checkStockEndpoint(req: Request, res: Response) {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se esperaba un array de items' });
    }
    
    const result = await ProductsService.checkStockForEndpoint(items);
    res.json(result);
  } catch (error) {
    console.error('Check stock endpoint error:', error);
    res.status(500).json({ error: 'Error al verificar stock' });
  }
}

// Seed initial products (from constants)
export async function seedProducts(req: Request, res: Response) {
  try {
    const { products: productList } = req.body;
    
    if (!Array.isArray(productList)) {
      return res.status(400).json({ error: 'Se esperaba un array de productos' });
    }

    // Get storeId from request context (header) or fallback to user's store
    const targetStoreId = req.storeId || (req as any).user?.storeId;
    
    if (!targetStoreId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Security check
    const user = (req as any).user;
    if (user.role !== 'super_admin' && targetStoreId !== user.storeId) {
      return res.status(403).json({ error: 'No tienes permiso para importar productos en esta tienda' });
    }

    const createdCount = await ProductsService.seed(targetStoreId, productList);

    res.json({ message: `${createdCount} productos importados` });
  } catch (error: any) {
    console.error('Seed products error:', error);
    
    if (error.message?.includes('PRODUCT_LIMIT_EXCEEDED')) {
      return res.status(403).json({ 
        error: 'Límite de productos excedido',
        message: error.message.split(': ')[1]
      });
    }
    
    res.status(500).json({ error: 'Error al importar productos' });
  }
}

// Track product view
export async function trackView(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const storeId = req.storeId; // Optional, but good for security
    
    console.log(`[Analytics] Track View Request: Product=${id}, Store=${storeId}`);

    if (storeId) {
      const { getLicenseUsage } = await import('../middleware/licenseEnforcement.middleware.js');
      const usage = await getLicenseUsage(storeId);
      
      console.log(`[Analytics] License Usage: Plan=${usage?.plan}`);

      // Only track for Pro and Enterprise plans
      if (usage && (usage.plan === 'pro' || usage.plan === 'enterprise')) {
        await ProductsService.trackView(id, storeId);
        console.log(`[Analytics] View tracked successfully`);
      } else {
        console.log(`[Analytics] View skipped due to plan limit`);
      }
    } else {
      console.log(`[Analytics] View skipped: No storeId`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    // Don't fail the request, just log error
    res.status(200).json({ success: true });
  }
}

// Track product click (e.g. add to cart or click from list)
export async function trackClick(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const storeId = req.storeId;
    
    console.log(`[Analytics] Track Click Request: Product=${id}, Store=${storeId}`);

    if (storeId) {
      const { getLicenseUsage } = await import('../middleware/licenseEnforcement.middleware.js');
      const usage = await getLicenseUsage(storeId);
      
      console.log(`[Analytics] License Usage: Plan=${usage?.plan}`);

      // Only track for Pro and Enterprise plans
      if (usage && (usage.plan === 'pro' || usage.plan === 'enterprise')) {
        await ProductsService.trackClick(id, storeId);
        console.log(`[Analytics] Click tracked successfully`);
      } else {
        console.log(`[Analytics] Click skipped due to plan limit`);
      }
    } else {
      console.log(`[Analytics] Click skipped: No storeId`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(200).json({ success: true });
  }
}
