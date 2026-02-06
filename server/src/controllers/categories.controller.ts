
import { Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { categories } from '../db/schema.js';
import { eq, asc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const storeId = req.storeId; // From storeResolver middleware
    
    // Strict isolation: return empty if no storeId
    if (!storeId) {
      console.warn('[Categories] No storeId - returning empty array for isolation');
      return res.json({ categories: [] });
    }
    
    const allCategories = await db.select()
      .from(categories)
      .where(eq(categories.storeId, storeId))
      .orderBy(asc(categories.orderNum));
    
    // Map to frontend format
    const formattedCategories = allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      order: cat.orderNum,
      isActive: Boolean(cat.isActive),
      isAccent: Boolean(cat.isAccent)
    }));

    res.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
};

// Create a new category (Admin only)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { id, name, slug, description, image, order, isActive, isAccent } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son requeridos' });
    }

    // Get storeId from authenticated user
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID not found in authenticated user' });
    }

    const categoryId = id || `cat-${uuidv4()}`;

    await db.insert(categories).values({
      id: categoryId,
      storeId, // Add storeId from authenticated user
      name,
      slug,
      description: description || null,
      image: image || null,
      orderNum: order || 0,
      isActive: isActive !== false,
      isAccent: isAccent || false,
    });

    console.log(`✅ Category created: ${name} (${categoryId})`);

    res.status(201).json({ 
      success: true,
      message: 'Categoría creada',
      category: { id: categoryId, name, slug, order, isActive: isActive !== false }
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese slug' });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// Update a category (Admin only)
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, order, isActive, isAccent } = req.body;
    
    // Get storeId from authenticated user for isolation
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Check if category exists AND belongs to this store
    const existing = await db.select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, storeId)))
      .limit(1);
      
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await db.update(categories)
      .set({
        name,
        slug,
        description: description || null,
        image: image || null,
        orderNum: order,
        isActive: isActive !== false,
        isAccent: isAccent || false,
      })
      .where(and(eq(categories.id, id), eq(categories.storeId, storeId)));

    console.log(`✅ Category updated: ${name} (${id})`);

    res.json({ success: true, message: 'Categoría actualizada' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// Delete a category (Admin only)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get storeId from authenticated user for isolation
    const storeId = (req as any).user?.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store context required' });
    }

    // Check if category exists AND belongs to this store
    const existing = await db.select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, storeId)))
      .limit(1);
      
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, storeId)));

    console.log(`🗑️ Category deleted: ${id}`);

    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};
