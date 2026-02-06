import { Request, Response, NextFunction } from 'express';
import { db, users } from '../db/drizzle.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { withStore } from '../db/rls.js';

// JWT_SECRET is now validated at startup via env.ts
// It MUST be at least 16 characters and has NO fallback
const JWT_SECRET = env.JWT_SECRET;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';   // Long-lived refresh token

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer' | 'super_admin';
  storeId: string; // Added for multi-tenant support
  name?: string;
  forcePasswordChange?: boolean;
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  storeId: string;
  type: 'access' | 'refresh';
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Generate access token (short-lived, 15 minutes)
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      storeId: user.storeId,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (long-lived, 7 days)
 */
export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      storeId: user.storeId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Generate both tokens at once
 */
export function generateTokenPair(user: AuthUser): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Verify a refresh token and return new token pair
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
    
    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    // Get fresh user data with RLS context
    // We use the storeId from the token to set the context
    const user = await withStore(decoded.storeId, async (tx) => {
        const [u] = await tx.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        return u;
    });
    
    if (!user) {
      return null;
    }
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: (user.role as AuthUser['role']) || 'customer',
      storeId: user.storeId,
    };
    
    return generateTokenPair(authUser);
  } catch {
    return null;
  }
}


export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Get fresh user data with RLS context
    // We use the storeId from the token to set the context
    // Note: If storeId in token is invalid or user was moved, this might fail, which is good security.
    const user = await withStore(decoded.storeId, async (tx) => {
        const [u] = await tx.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        return u;
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: (user.role as AuthUser['role']) || 'customer',
      storeId: user.storeId, // Include storeId from DB
      forcePasswordChange: user.forcePasswordChange || false
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Check if password change is forced
  if (req.user?.forcePasswordChange) {
    // Allow only password change endpoint
    if (req.path !== '/auth/password') {
      return res.status(403).json({ 
        error: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Debes cambiar tu contraseña antes de continuar'
      });
    }
  }
  
  next();
};

/**
 * Super Admin Middleware
 * Requires user to have super_admin role for mothership operations
 */
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Super admin access required',
      message: 'This operation requires super admin privileges'
    });
  }
  
  next();
};

/**
 * Role-based Middleware Factory
 * Creates a middleware that requires user to have one of the specified roles
 */
export const requireRole = (allowedRoles: AuthUser['role'][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    
    // Check if password change is forced
    if (req.user?.forcePasswordChange) {
      if (req.path !== '/auth/password') {
        return res.status(403).json({ 
          error: 'Password change required',
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Debes cambiar tu contraseña antes de continuar'
        });
      }
    }
    
    next();
  };
};

// Export aliases for consistency
export const authenticateToken = authMiddleware;
export const requireAdmin = adminMiddleware;
