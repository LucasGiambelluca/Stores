import { v4 as uuidv4 } from 'uuid';
import { eq, sql, desc, asc, inArray, and } from 'drizzle-orm';
import { db, products, categories, type Product } from '../db/drizzle.js';
import { withStore, withStoreContext } from '../db/rls.js';
import { cache, cacheKeys, cacheTTL } from './cache.service.js';

export interface ProductBody {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  transferPrice?: number;
  categoryId?: string;
  subcategory?: string;
  image?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  variantsStock?: Record<string, number>; // Stock per color variant e.g. {"Red": 5, "Blue": 2}
  stockStatus?: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  order?: number;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  limit?: number;
  offset?: number;
}

// Input type for stock checking (flexible to accept different formats)
interface StockCheckItem {
  productId?: string;
  id?: string;
  quantity?: number;
}

// Extended ProductBody with optional id for seeding
interface SeedProductBody extends ProductBody {
  id?: string;
  category?: string; // Alias for categoryId
}

export class ProductsService {
  private storeId?: string;

  constructor(storeId?: string) {
    this.storeId = storeId;
  }

  // Instance methods for StoreScope
  async findAll(filters: ProductFilters) {
    return ProductsService.findAll(this.storeId, filters);
  }

  async findById(id: string) {
    return ProductsService.findById(id, this.storeId);
  }

  async create(body: ProductBody) {
    if (!this.storeId) throw new Error('Store ID required for create');
    return ProductsService.create(this.storeId, body);
  }

  async update(id: string, body: ProductBody) {
    return ProductsService.update(id, body, this.storeId);
  }

  async delete(id: string) {
    return ProductsService.delete(id, this.storeId);
  }

  // Helper to format product
  private static formatProduct(p: Product & { categoryName?: string; categorySlug?: string }) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      transferPrice: p.transferPrice,
      category: p.categorySlug || p.categoryId,
      subcategory: p.subcategory,
      image: p.image,
      images: p.images || [],
      sizes: p.sizes || [],
      colors: p.colors || [],
      stock: p.stock,
      stockStatus: p.stockStatus || (p.stock! <= 0 ? 'Sin stock' : p.stock! <= 5 ? 'Últimas unidades' : 'En stock'),
      isBestSeller: p.isBestSeller,
      isNew: p.isNew,
      isOnSale: p.isOnSale,
      order: p.orderNum,
    };
  }

  static async findAll(storeId: string | undefined, filters: ProductFilters) {
    const { category, subcategory, limit = 100, offset = 0 } = filters;

    // Generate cache key based on filters
    // Note: We only cache if storeId is present
    if (storeId) {
      const cacheKey = `${cacheKeys.products(storeId)}:${JSON.stringify(filters)}`;
      
      return cache.getOrSet(cacheKey, async () => {
        return this.fetchProducts(storeId, filters);
      }, cacheTTL.MEDIUM);
    }

    return this.fetchProducts(storeId, filters);
  }

  // Extracted fetch logic for reuse/caching
  private static async fetchProducts(storeId: string | undefined, filters: ProductFilters) {
    const { category, subcategory, limit = 100, offset = 0 } = filters;

    // Use withStoreContext to wrap in transaction and set RLS variable
    return withStoreContext(storeId, async (tx) => {
        // Build WHERE conditions
        // Note: Even with RLS, we keep the WHERE clause for explicit filtering and performance
        let whereClause;
        
        if (storeId) {
          if (category && subcategory) {
             whereClause = sql`${products.storeId} = ${storeId} AND (${products.categoryId} = ${category} OR ${categories.slug} = ${category}) AND ${products.subcategory} = ${subcategory}`;
          } else if (category) {
            whereClause = sql`${products.storeId} = ${storeId} AND (${products.categoryId} = ${category} OR ${categories.slug} = ${category})`;
          } else if (subcategory) {
            whereClause = sql`${products.storeId} = ${storeId} AND ${products.subcategory} = ${subcategory}`;
          } else {
            whereClause = eq(products.storeId, storeId);
          }
        } else {
          // If no storeId, RLS will likely return empty, but we can return early
          console.warn('[ProductsService] No storeId - returning empty array');
          return { products: [], total: 0 };
        }

        const results = await tx
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            originalPrice: products.originalPrice,
            transferPrice: products.transferPrice,
            categoryId: products.categoryId,
            subcategory: products.subcategory,
            image: products.image,
            images: products.images,
            sizes: products.sizes,
            colors: products.colors,
            stock: products.stock,
            stockStatus: products.stockStatus,
            isBestSeller: products.isBestSeller,
            isNew: products.isNew,
            isOnSale: products.isOnSale,
            orderNum: products.orderNum,
            createdAt: products.createdAt,
            categoryName: categories.name,
            categorySlug: categories.slug,
          })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(whereClause)
          .orderBy(asc(products.orderNum), desc(products.createdAt))
          .limit(Number(limit))
          .offset(Number(offset));

        const formattedProducts = results.map((p: any) => this.formatProduct(p));

        const countQuery = await tx
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(storeId ? eq(products.storeId, storeId) : undefined);
        
        return {
          products: formattedProducts,
          total: countQuery[0]?.count ?? 0
        };
    });
  }

  static async findById(id: string, storeId?: string) {
    if (storeId) {
      const cacheKey = cacheKeys.productById(storeId, id);
      return cache.getOrSet(cacheKey, async () => {
        return this.fetchById(id, storeId);
      }, cacheTTL.MEDIUM);
    }
    return this.fetchById(id, storeId);
  }

  private static async fetchById(id: string, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
        const whereClause = storeId 
          ? and(eq(products.id, id), eq(products.storeId, storeId))
          : eq(products.id, id);

        const result = await tx
          .select({
            id: products.id,
            storeId: products.storeId,
            name: products.name,
            description: products.description,
            price: products.price,
            originalPrice: products.originalPrice,
            transferPrice: products.transferPrice,
            categoryId: products.categoryId,
            subcategory: products.subcategory,
            image: products.image,
            images: products.images,
            sizes: products.sizes,
            colors: products.colors,
            stock: products.stock,
            stockStatus: products.stockStatus,
            isBestSeller: products.isBestSeller,
            isNew: products.isNew,
            isOnSale: products.isOnSale,
            orderNum: products.orderNum,
            categoryName: categories.name,
            categorySlug: categories.slug,
          })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(whereClause)
          .limit(1);

        if (result.length === 0) return null;
        
        const p = result[0] as any;
        return {
          ...this.formatProduct(p),
          storeId: p.storeId,
        };
    });
  }

  static async create(storeId: string, body: ProductBody) {
    const id = uuidv4();
    
    // Invalidate cache
    cache.deleteByPrefix(cacheKeys.products(storeId));

    // Calculate total stock from variantsStock if provided
    let stockValue = body.stock ?? 100;
    if (body.variantsStock && Object.keys(body.variantsStock).length > 0) {
      stockValue = Object.values(body.variantsStock).reduce((sum, qty) => sum + qty, 0);
    }

    // Use withStore to ensure RLS context
    return withStore(storeId, async (tx) => {
      // 1. Check license limits
      const { getLicenseUsage } = await import('../middleware/licenseEnforcement.middleware.js');
      const usage = await getLicenseUsage(storeId, tx);

      if (!usage) {
        throw new Error('NO_LICENSE: No valid license found');
      }

      if (!usage.canCreateProduct) {
        throw new Error(`PRODUCT_LIMIT_EXCEEDED: Has alcanzado el límite de ${usage.maxProducts} productos.`);
      }

      // 2. Insert product
      await tx.insert(products).values({
        id,
        storeId,
        name: body.name,
        description: body.description ?? null,
        price: body.price,
        originalPrice: body.originalPrice ?? null,
        transferPrice: body.transferPrice ?? null,
        categoryId: body.categoryId ?? null,
        subcategory: body.subcategory ?? null,
        image: body.image ?? null,
        images: body.images ?? null,
        sizes: body.sizes ?? null,
        colors: body.colors ?? null,
        stock: stockValue,
        variantsStock: body.variantsStock ?? null,
        stockStatus: body.stockStatus ?? null,
        isBestSeller: body.isBestSeller ?? false,
        isNew: body.isNew ?? false,
        isOnSale: body.isOnSale ?? false,
        orderNum: body.order ?? 0,
      });
      
      return { id, ...body, stock: stockValue };
    });
  }

  static async update(id: string, body: ProductBody, storeId?: string) {
    if (storeId) {
      // Invalidate specific product and list
      cache.delete(cacheKeys.productById(storeId, id));
      cache.deleteByPrefix(cacheKeys.products(storeId));
    }

    // Calculate total stock from variantsStock if provided
    let stockValue = body.stock;
    if (body.variantsStock && Object.keys(body.variantsStock).length > 0) {
      stockValue = Object.values(body.variantsStock).reduce((sum, qty) => sum + qty, 0);
    }

    return withStoreContext(storeId, async (tx) => {
        const whereClause = storeId 
          ? and(eq(products.id, id), eq(products.storeId, storeId))
          : eq(products.id, id);

        const existing = await tx.select({ id: products.id }).from(products).where(whereClause).limit(1);
        if (existing.length === 0) return null;

        await tx.update(products)
          .set({
            name: body.name,
            description: body.description ?? null,
            price: body.price,
            originalPrice: body.originalPrice ?? null,
            transferPrice: body.transferPrice ?? null,
            categoryId: body.categoryId ?? null,
            subcategory: body.subcategory ?? null,
            image: body.image ?? null,
            images: body.images ?? null,
            sizes: body.sizes ?? null,
            colors: body.colors ?? null,
            stock: stockValue,
            variantsStock: body.variantsStock ?? null,
            stockStatus: body.stockStatus ?? null,
            isBestSeller: body.isBestSeller ?? false,
            isNew: body.isNew ?? false,
            isOnSale: body.isOnSale ?? false,
            orderNum: body.order ?? 0,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(whereClause);

        return true;
    });
  }

  static async delete(id: string, storeId?: string) {
    if (storeId) {
      cache.delete(cacheKeys.productById(storeId, id));
      cache.deleteByPrefix(cacheKeys.products(storeId));
    }

    return withStoreContext(storeId, async (tx) => {
        const whereClause = storeId 
          ? and(eq(products.id, id), eq(products.storeId, storeId))
          : eq(products.id, id);

        const existing = await tx.select({ id: products.id }).from(products).where(whereClause).limit(1);
        if (existing.length === 0) return false;

        await tx.delete(products).where(whereClause);
        return true;
    });
  }

  static async updateStock(productId: string, quantity: number, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
        try {
        await tx.update(products)
            .set({
            stock: sql`${products.stock} - ${quantity}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(and(
                eq(products.id, productId), 
                sql`${products.stock} >= ${quantity}`,
                storeId ? eq(products.storeId, storeId) : undefined
            ));
        return true;
        } catch (error) {
        console.error('Update stock error:', error);
        return false;
        }
        
        // Low Stock Check
        try {
            const [product] = await tx
                .select({ name: products.name, stock: products.stock, storeId: products.storeId })
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);

            if (product && (product.stock ?? 10) <= 5 && product.storeId) {
                 const { stores } = await import('../db/drizzle.js');
                 const [store] = await tx.select({ ownerEmail: stores.ownerEmail })
                    .from(stores)
                    .where(eq(stores.id, product.storeId))
                    .limit(1);
                 
                 if (store?.ownerEmail) {
                     import('../services/email.service.js').then(emailService => {
                        emailService.sendLowStockAlert(store.ownerEmail, [product], 5)
                            .catch(err => console.error('Low stock email error:', err));
                     });
                 }
            }
        } catch (err) {
            console.error('Error checking low stock (single):', err);
        }
    });
  }

  static async batchUpdateStock(items: { productId: string; quantity: number }[], storeId?: string) {
    if (items.length === 0) return true;
    
    return withStoreContext(storeId, async (tx) => {
        try {
        const caseStatements = items.map(item => 
            `WHEN id = '${item.productId}' THEN stock - ${item.quantity}`
        ).join(' ');
        
        const productIds = items.map(i => `'${i.productId}'`).join(',');
        
        // Use raw SQL but we should try to inject storeId check if possible
        // But raw SQL is hard to combine with RLS variable if we don't use tx.execute
        // tx.execute should respect the RLS variable set by withStoreContext
        
        await tx.execute(sql.raw(`
            UPDATE products 
            SET stock = CASE ${caseStatements} ELSE stock END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (${productIds})
            ${storeId ? `AND store_id = '${storeId}'` : ''}
        `));
        
        } catch (error) {
            console.error('Batch update stock error:', error);
            return false;
        }

        // Low Stock Check (After successful update)
        try {
            const productIds = items.map(i => i.productId);
            // Fetch products with low stock (e.g. <= 5)
            const lowStockProducts = await tx
                .select({ name: products.name, stock: products.stock })
                .from(products)
                .where(and(
                    inArray(products.id, productIds),
                    sql`${products.stock} <= 5`,
                    storeId ? eq(products.storeId, storeId) : undefined
                ));
            
            if (lowStockProducts.length > 0 && storeId) {
                // Fetch owner email
                const { stores } = await import('../db/drizzle.js');
                const storeResult = await tx
                    .select({ ownerEmail: stores.ownerEmail })
                    .from(stores)
                    .where(eq(stores.id, storeId))
                    .limit(1);
                
                const ownerEmail = storeResult[0]?.ownerEmail;
                
                if (ownerEmail) {
                    import('../services/email.service.js').then(emailService => {
                        emailService.sendLowStockAlert(ownerEmail, lowStockProducts, 5)
                           .catch(err => console.error('Low stock email error:', err));
                    });
                }
            }
        } catch (error) {
            console.error('Error checking low stock:', error);
            // Don't fail the transaction just because of email
        }

        return true;
    });
  }

  static async checkStock(items: { productId: string; quantity: number }[], storeId?: string) {
    if (items.length === 0) {
      return { valid: true, errors: [] };
    }
    
    return withStoreContext(storeId, async (tx) => {
        const errors: string[] = [];
        const productIds = items.map(item => item.productId);
        
        const productsResult = await tx
        .select({ 
            id: products.id, 
            name: products.name, 
            stock: products.stock 
        })
        .from(products)
        .where(and(
            inArray(products.id, productIds),
            storeId ? eq(products.storeId, storeId) : undefined
        ));
        
        const productMap = new Map(productsResult.map((p: { id: string; name: string; stock: number | null }) => [p.id, p]));
        
        for (const item of items) {
        const product = productMap.get(item.productId) as { id: string; name: string; stock: number | null } | undefined;
        if (!product) {
            errors.push(`Producto no encontrado: ${item.productId}`);
        } else if ((product.stock ?? 0) < item.quantity) {
            errors.push(`Stock insuficiente de "${product.name}": disponible ${product.stock}, solicitado ${item.quantity}`);
        }
        }
        
        return { valid: errors.length === 0, errors };
    });
  }

  static async checkStockForEndpoint(items: StockCheckItem[], storeId?: string) {
      // Validate items structure
      const validatedItems = items.map((item) => ({
        productId: item.productId || item.id || '',
        quantity: item.quantity || 1,
      }));
      
      if (validatedItems.length === 0) {
        return { valid: true, errors: [], stockInfo: [] };
      }
      
      return withStoreContext(storeId, async (tx) => {
          const productIds = validatedItems.map((item: { productId: string }) => item.productId);
          
          const productsResult = await tx
            .select({ 
              id: products.id, 
              name: products.name, 
              stock: products.stock 
            })
            .from(products)
            .where(and(
                inArray(products.id, productIds),
                storeId ? eq(products.storeId, storeId) : undefined
            ));
          
          const productMap = new Map(productsResult.map((p: { id: string; name: string; stock: number | null }) => [p.id, p]));
          
          const errors: string[] = [];
          const stockInfo = validatedItems.map((item: { productId: string; quantity: number }) => {
            const product = productMap.get(item.productId) as { id: string; name: string; stock: number | null } | undefined;
            const available = product?.stock ?? 0;
            const sufficient = available >= item.quantity;
            
            if (!product) {
              errors.push(`Producto no encontrado: ${item.productId}`);
            } else if (!sufficient) {
              errors.push(`Stock insuficiente de "${product.name}": disponible ${available}, solicitado ${item.quantity}`);
            }
            
            return {
              productId: item.productId,
              requested: item.quantity,
              available,
              sufficient,
            };
          });
          
          return {
            valid: errors.length === 0,
            errors,
            stockInfo,
          };
      });
  }

  static async seed(storeId: string, productList: SeedProductBody[]) {
    let created = 0;

    // Use withStore for RLS
    await withStore(storeId, async (tx) => {
      const { getLicenseUsage } = await import('../middleware/licenseEnforcement.middleware.js');
      const usage = await getLicenseUsage(storeId, tx);

      if (!usage) throw new Error('NO_LICENSE: No valid license found');
      
      const maxProducts = usage.maxProducts;
      const currentCount = usage.productCount;
      const newCount = productList.length;

      if (maxProducts !== null && (currentCount + newCount) > maxProducts) {
        throw new Error(`PRODUCT_LIMIT_EXCEEDED: No se pueden importar ${newCount} productos. Límite: ${maxProducts}, Actuales: ${currentCount}`);
      }

      for (const p of productList) {
        await tx.insert(products)
          .values({
            id: p.id || uuidv4(),
            storeId,
            name: p.name,
            description: p.description ?? null,
            price: p.price,
            originalPrice: p.originalPrice ?? null,
            transferPrice: p.transferPrice ?? null,
            categoryId: p.categoryId || p.category || null,
            subcategory: p.subcategory ?? null,
            image: p.image ?? null,
            images: p.images ?? null,
            sizes: p.sizes ?? null,
            colors: p.colors ?? null,
            stock: p.stock ?? 100,
            stockStatus: p.stockStatus ?? null,
            isBestSeller: p.isBestSeller ?? false,
            isNew: p.isNew ?? false,
            isOnSale: p.isOnSale ?? false,
            orderNum: p.order ?? 0,
          })
          .onConflictDoUpdate({
            target: products.id,
            set: {
              name: p.name,
              price: p.price,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });
        created++;
      }
    });

    return created;
  }

  static async trackView(productId: string, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
      await tx.update(products)
        .set({ views: sql`${products.views} + 1` })
        .where(and(
          eq(products.id, productId),
          storeId ? eq(products.storeId, storeId) : undefined
        ));
      return true;
    });
  }

  static async trackClick(productId: string, storeId?: string) {
    return withStoreContext(storeId, async (tx) => {
      await tx.update(products)
        .set({ clicks: sql`${products.clicks} + 1` })
        .where(and(
          eq(products.id, productId),
          storeId ? eq(products.storeId, storeId) : undefined
        ));
      return true;
    });
  }
}
