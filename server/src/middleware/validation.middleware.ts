/**
 * Input Validation Middleware
 * 
 * Uses Zod schemas to validate request body, params, and query.
 * Provides type-safe validation with clear error messages.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// Generic validation middleware factory
export function validate<T extends ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = await schema.parseAsync(data);
      
      // Replace with validated data
      if (source === 'body') req.body = validated;
      else if (source === 'query') req.query = validated;
      else req.params = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        

        
        // Log validation error for debugging (Console + File)
        console.error(`[Validation Error] ${source} validation failed:`);
        const logData = `
[${new Date().toISOString()}] Validation Error (${source}):
Body: ${JSON.stringify(source === 'body' ? req.body : {}, null, 2)}
Errors: ${JSON.stringify(errors, null, 2)}
---------------------------------------------------
`;
        console.error(logData);
        
        try {
          // Write to a file in the project root/server for inspection
          const fs = await import('fs');
          const path = await import('path');
          const logPath = path.resolve(process.cwd(), 'validation_errors.log');
          fs.appendFileSync(logPath, logData);
        } catch (err) {
          console.error('Failed to write validation log file:', err);
        }
        
        return res.status(400).json({
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }
      next(error);
    }
  };
}

// ===========================================
// COMMON VALIDATION SCHEMAS
// ===========================================

// Email validation - trim and lowercase BEFORE validation
export const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Email inválido')
  .min(5, 'Email muy corto')
  .max(255, 'Email muy largo');

// Password validation
export const passwordSchema = z.string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(100, 'Contraseña muy larga');

// Phone validation (Argentina format)
export const phoneSchema = z.string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono inválido')
  .min(8, 'Teléfono muy corto')
  .max(20, 'Teléfono muy largo')
  .optional();

// UUID validation
export const uuidSchema = z.string().uuid('ID inválido');

// Positive integer
export const positiveInt = z.coerce.number().int().positive();

// ===========================================
// ORDER SCHEMAS
// ===========================================

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'ID de producto requerido'),
  productName: z.string().min(1, 'Nombre de producto requerido'),
  productImage: z.string().optional(),
  price: z.number().positive('Precio debe ser positivo'),
  quantity: z.number().int().min(1, 'Cantidad mínima es 1').max(100, 'Cantidad máxima es 100'),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const createOrderSchema = z.object({
  customerEmail: emailSchema,
  customerName: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .trim(),
  customerPhone: phoneSchema,
  shippingAddress: z.string().max(500, 'Dirección muy larga').optional(),
  shippingMethod: z.string().max(50).optional(),
  shippingCost: z.number().min(0).optional(),
  items: z.array(orderItemSchema).min(1, 'El carrito está vacío'),
  paymentMethod: z.string().max(50).optional(),
  notes: z.string().max(1000, 'Notas muy largas').optional(),
});

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .trim()
    .optional(),
  phone: phoneSchema,
  storeName: z.string().min(3, 'Nombre de tienda muy corto').max(50).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: passwordSchema,
});

// ===========================================
// PRODUCT SCHEMAS
// ===========================================

// Helper to parse currency strings (LatAm format: . = thousands, , = decimal)
const parsePrice = (val: unknown) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Remove symbols and spaces
    let clean = val.replace(/[$\sA-Za-z]/g, '');
    
    // Handle LatAm format (1.000,50) vs US format (1,000.50) heuristics
    if (clean.includes(',')) {
      // Assume LatAm: remove dots, replace comma with dot
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
       // If no comma, remove dots if they look like thousands separators
       // e.g. "9.100" -> "9100"
       if (/^\d{1,3}(\.\d{3})*$/.test(clean)) {
          clean = clean.replace(/\./g, '');
       }
    }
    return Number(clean);
  }
  return val;
};

const priceSchema = z.preprocess(
  parsePrice,
  z.number().positive('Precio debe ser positivo')
);

export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'Nombre muy corto')
    .max(200, 'Nombre muy largo')
    .trim(),
  description: z.string().max(5000, 'Descripción muy larga').optional().nullable(),
  price: priceSchema,
  originalPrice: z.preprocess(parsePrice, z.number().positive().optional().nullable()),
  transferPrice: z.preprocess(parsePrice, z.number().positive().optional().nullable()),
  categoryId: z.string().optional().nullable().transform(v => (!v || v.trim() === '') ? null : v),
  subcategory: z.string().optional().nullable().transform(v => (!v || v.trim() === '') ? null : v),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  stockStatus: z.string().optional().nullable(),
  sizes: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        if (!val.trim()) return [];
        try { return JSON.parse(val); } catch { return val.split(',').map(s => s.trim()).filter(Boolean); }
      }
      if (Array.isArray(val)) {
        return val.filter(s => typeof s === 'string' && s.trim().length > 0);
      }
      return val;
    },
    z.array(z.string()).optional().nullable()
  ),
  colors: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        if (!val.trim()) return [];
        try { return JSON.parse(val); } catch { return val.split(',').map(s => s.trim()).filter(Boolean); }
      }
      return val;
    },
    z.array(
      z.union([
        z.string(),
        z.object({ name: z.string().optional(), hex: z.string().optional() }).passthrough()
      ])
    ).optional().nullable()
  ),
  image: z.string().optional().nullable(),
  images: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; } 
      }
      return val;
    },
    z.array(z.string()).optional().nullable()
  ),
  isBestSeller: z.boolean().optional().nullable(),
  isNew: z.boolean().optional().nullable(),
  isOnSale: z.boolean().optional().nullable(),
  variantsStock: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        if (!val.trim()) return null;
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    z.record(z.string(), z.number().int().min(0)).optional().nullable()
  ),
  order: z.coerce.number().int().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

// ===========================================
// CATEGORY SCHEMAS
// ===========================================

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100).trim(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isAccent: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ===========================================
// SHIPPING SCHEMAS
// ===========================================

export const shippingQuoteSchema = z.object({
  postalCode: z.string().min(4).max(10),
  subtotal: z.number().min(0),
  items: z.array(z.object({
    weight: z.number().optional(),
    quantity: z.number().min(1),
  })).optional(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().uuid('ID de orden inválido'),
  carrier: z.string().optional(),
});

// ===========================================
// SANITIZATION HELPERS
// ===========================================

// Sanitize HTML/script tags from strings
export function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Sanitize object recursively
export function sanitizeObject<T extends object>(obj: T): T {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(v => 
        typeof v === 'string' ? sanitizeString(v) : 
        typeof v === 'object' && v !== null ? sanitizeObject(v) : v
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

// Middleware that sanitizes request body
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}
