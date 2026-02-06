// Reviews Controller - Product ratings and reviews
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db, reviews, products, orders, orderItems, type Review, type NewReview } from '../db/drizzle.js';
import { withStore, withStoreContext } from '../db/rls.js';

interface ReviewBody {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  customerName: string;
  customerEmail?: string;
}

// Get reviews for a product
export async function getProductReviews(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const storeId = (req as any).storeId; // Should be available from domain middleware

    const result = await withStoreContext(storeId, async (tx) => {
        const productReviews = await tx.select()
        .from(reviews)
        .where(and(
            eq(reviews.productId, productId),
            eq(reviews.isApproved, true)
        ))
        .orderBy(desc(reviews.createdAt));

        // Calculate average rating
        const statsResult = await tx.execute(sql`
        SELECT 
            COUNT(*) as total,
            AVG(rating) as average,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one
        FROM reviews 
        WHERE product_id = ${productId} AND is_approved = true
        `);
        const stats = statsResult[0] as any;

        return {
            reviews: productReviews,
            stats: {
                total: stats?.total || 0,
                average: Math.round((stats?.average || 0) * 10) / 10,
                distribution: {
                5: stats?.five || 0,
                4: stats?.four || 0,
                3: stats?.three || 0,
                2: stats?.two || 0,
                1: stats?.one || 0,
                }
            }
        };
    });

    res.json(result);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Error al obtener opiniones' });
  }
}

// Create a new review
export async function createReview(req: Request, res: Response) {
  try {
    const body: ReviewBody = req.body;
    const userId = req.user?.id || null;
    const reqStoreId = (req as any).storeId;

    if (!body.productId || !body.rating || !body.customerName) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (body.rating < 1 || body.rating > 5) {
      return res.status(400).json({ error: 'Rating debe ser entre 1 y 5' });
    }

    // Use withStoreContext to ensure we can read the product if RLS is active
    // We expect reqStoreId to be present from domain middleware
    const result = await withStoreContext(reqStoreId, async (tx) => {
        // Check if product exists and get storeId
        // If RLS is active, we can only see products from the current store
        const product = await tx.select({ id: products.id, storeId: products.storeId })
        .from(products)
        .where(eq(products.id, body.productId))
        .limit(1);
        
        if (product.length === 0) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        const storeId = product[0].storeId;
        
        // Verify storeId matches context if present
        if (reqStoreId && storeId !== reqStoreId) {
             // This shouldn't happen if RLS is working correctly (query wouldn't return it)
             // But good as a sanity check
             throw new Error('PRODUCT_NOT_FOUND');
        }

        // Check if user/email already reviewed this product
        if (body.customerEmail) {
            const existing = await tx.select({ id: reviews.id })
                .from(reviews)
                .where(and(
                eq(reviews.productId, body.productId),
                eq(reviews.customerEmail, body.customerEmail)
                ))
                .limit(1);
            
            if (existing.length > 0) {
                throw new Error('ALREADY_REVIEWED');
            }
        }

        // Check if verified purchase
        let isVerifiedPurchase = false;
        if (body.customerEmail) {
            const orderResult = await tx.execute(sql`
                SELECT o.id FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_email = ${body.customerEmail} 
                AND oi.product_id = ${body.productId} 
                AND o.status IN ('paid', 'delivered')
                LIMIT 1
            `);
            
            if (orderResult.length > 0) {
                isVerifiedPurchase = true;
            }
        }

        const id = uuidv4();
        await tx.insert(reviews).values({
            id,
            storeId, 
            productId: body.productId,
            userId,
            customerName: body.customerName,
            customerEmail: body.customerEmail ?? null,
            rating: body.rating,
            title: body.title ?? null,
            comment: body.comment ?? null,
            isVerifiedPurchase,
        });

        return { id, isVerifiedPurchase };
    });

    res.status(201).json({
      message: '¡Gracias por tu opinión!',
      review: result
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    if (error.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (error.message === 'ALREADY_REVIEWED') {
        return res.status(400).json({ error: 'Ya dejaste una opinión para este producto' });
    }
    res.status(500).json({ error: 'Error al crear opinión' });
  }
}

// Get all reviews (admin)
export async function getAllReviews(req: Request, res: Response) {
  try {
    const { approved, limit = 50, offset = 0 } = req.query;
    
    // Get storeId from authenticated user for isolation
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      console.warn('[Reviews] No storeId - returning empty for isolation');
      return res.json({ reviews: [] });
    }

    const result = await withStore(storeId, async (tx) => {
        let query;
        if (approved !== undefined) {
            const isApproved = approved === 'true';
            query = tx
                .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                customerName: reviews.customerName,
                customerEmail: reviews.customerEmail,
                rating: reviews.rating,
                title: reviews.title,
                comment: reviews.comment,
                isVerifiedPurchase: reviews.isVerifiedPurchase,
                isApproved: reviews.isApproved,
                createdAt: reviews.createdAt,
                productName: products.name,
                })
                .from(reviews)
                .leftJoin(products, eq(reviews.productId, products.id))
                .where(and(eq(reviews.storeId, storeId), eq(reviews.isApproved, isApproved)))
                .orderBy(desc(reviews.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));
        } else {
            query = tx
                .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                customerName: reviews.customerName,
                customerEmail: reviews.customerEmail,
                rating: reviews.rating,
                title: reviews.title,
                comment: reviews.comment,
                isVerifiedPurchase: reviews.isVerifiedPurchase,
                isApproved: reviews.isApproved,
                createdAt: reviews.createdAt,
                productName: products.name,
                })
                .from(reviews)
                .leftJoin(products, eq(reviews.productId, products.id))
                .where(eq(reviews.storeId, storeId))
                .orderBy(desc(reviews.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));
        }
        return await query;
    });

    res.json({ reviews: result });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Error al obtener opiniones' });
  }
}

// Approve/reject review (admin)
export async function moderateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    // Get storeId from authenticated user for isolation
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    await withStore(storeId, async (tx) => {
        // Check if review exists AND belongs to this store
        const existing = await tx.select({ id: reviews.id })
        .from(reviews)
        .where(and(eq(reviews.id, id), eq(reviews.storeId, storeId)))
        .limit(1);

        if (existing.length === 0) {
            throw new Error('REVIEW_NOT_FOUND');
        }

        await tx.update(reviews)
        .set({ isApproved: approved })
        .where(and(eq(reviews.id, id), eq(reviews.storeId, storeId)));
    });

    res.json({ message: approved ? 'Opinión aprobada' : 'Opinión rechazada' });
  } catch (error: any) {
    console.error('Moderate review error:', error);
    if (error.message === 'REVIEW_NOT_FOUND') {
        return res.status(404).json({ error: 'Opinión no encontrada' });
    }
    res.status(500).json({ error: 'Error al moderar opinión' });
  }
}

// Delete review (admin)
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get storeId from authenticated user for isolation
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    await withStore(storeId, async (tx) => {
        // Check if review exists AND belongs to this store
        const existing = await tx.select({ id: reviews.id })
        .from(reviews)
        .where(and(eq(reviews.id, id), eq(reviews.storeId, storeId)))
        .limit(1);

        if (existing.length === 0) {
            throw new Error('REVIEW_NOT_FOUND');
        }

        await tx.delete(reviews)
        .where(and(eq(reviews.id, id), eq(reviews.storeId, storeId)));
    });

    res.json({ message: 'Opinión eliminada' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    if (error.message === 'REVIEW_NOT_FOUND') {
        return res.status(404).json({ error: 'Opinión no encontrada' });
    }
    res.status(500).json({ error: 'Error al eliminar opinión' });
  }
}
