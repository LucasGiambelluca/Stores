/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF protection using the Double Submit Cookie pattern.
 * - On GET to /api/csrf-token, sets a cookie and returns the token
 * - On mutations (POST/PUT/DELETE), validates the token in header matches cookie
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// Routes that don't need CSRF protection
const EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/webhook', 
  '/api/health',
  '/api/mothership', // Mothership uses Bearer tokens
  '/api/stores',     // Store creation uses Bearer tokens
  '/api',            // General exemption since we use Header-based Auth (JWT)
];

// Methods that require CSRF validation
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Generate a new CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Endpoint to get a CSRF token
 * GET /api/csrf-token
 */
export function getCsrfToken(req: Request, res: Response) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  
  // Generate new token if none exists
  if (!token) {
    token = generateToken();
  }
  
  // Set cookie (httpOnly: false so JS can read it for SPA)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  
  res.json({ csrfToken: token });
}

/**
 * CSRF validation middleware
 * Validates token on mutations
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip if not a protected method
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }
  
  // Skip exempt routes
  const isExempt = EXEMPT_ROUTES.some(route => req.originalUrl.startsWith(route));
  if (isExempt) {
    return next();
  }
  
  // Get tokens
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;
  
  // Validate
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.warn(`[CSRF] Token mismatch for ${req.method} ${req.path}`, {
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
      ip: req.ip,
    });
    
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID',
    });
  }
  
  next();
}

/**
 * Optional: Strict CSRF middleware (use in production)
 * Same as above but logs more details
 */
export function strictCsrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    // In development, just log but don't block
    if (PROTECTED_METHODS.includes(req.method)) {
      const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
      const headerToken = req.headers[CSRF_HEADER_NAME] as string;
      
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.debug(`[CSRF] Would block in production: ${req.method} ${req.path}`);
      }
    }
    return next();
  }
  
  // In production, use strict validation
  return csrfMiddleware(req, res, next);
}
