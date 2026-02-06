import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Configuration
 * 
 * Different limits for different types of requests:
 * - General API: 100 requests per minute
 * - Auth endpoints: 10 requests per minute (prevent brute force)
 * - File uploads: 20 requests per minute
 * - Order creation: 30 per minute per store
 */

// Key generator that uses storeId + IP for multi-tenant rate limiting
const storeKeyGenerator = (req: Request): string => {
  const storeId = req.storeId || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${storeId}:${ip}`;
};

// General API rate limiter
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Has excedido el límite de solicitudes. Intenta de nuevo en un minuto.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: storeKeyGenerator,
  validate: { xForwardedForHeader: false },
});

// Strict limiter for auth endpoints (login, register)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many login attempts',
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en un minuto.',
    code: 'AUTH_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
  skip: () => process.env.NODE_ENV === 'test',
  validate: { xForwardedForHeader: false },
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 uploads per minute
  message: {
    error: 'Too many uploads',
    message: 'Has excedido el límite de subidas. Intenta de nuevo en un minuto.',
    code: 'UPLOAD_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: storeKeyGenerator,
  validate: { xForwardedForHeader: false },
});

// Order creation limiter
export const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 orders per minute per store
  message: {
    error: 'Too many orders',
    message: 'Has excedido el límite de órdenes. Intenta de nuevo en un minuto.',
    code: 'ORDER_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: storeKeyGenerator,
  validate: { xForwardedForHeader: false },
});

// Mothership API limiter (super admin actions)
export const mothershipLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Límite de solicitudes excedido.',
    code: 'MOTHERSHIP_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
