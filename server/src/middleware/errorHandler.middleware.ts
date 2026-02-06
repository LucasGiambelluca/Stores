import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { env, isProduction, hasSentry } from '../env.js';
import { isAppError, isOperationalError, formatErrorResponse, getErrorStatusCode } from '../errors/index.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Generate unique error ID for tracking
  const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
  const correlationId = (req as any).correlationId || 'no-correlation-id';
  
  // Determine if this is an operational (expected) or programming (bug) error
  const operational = isOperationalError(err);
  const statusCode = getErrorStatusCode(err);
  
  // Log with context - more detail for non-operational errors
  const logData = {
    errorId,
    correlationId,
    message: err.message,
    code: isAppError(err) ? err.code : 'UNKNOWN',
    statusCode,
    operational,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id,
    storeId: (req as any).storeId,
    ip: req.ip,
    stack: isProduction || operational ? undefined : err.stack,
  };
  
  if (operational) {
    console.warn(`⚠️ [${errorId}] Operational Error:`, logData);
  } else {
    console.error(`❌ [${errorId}] Programming Error:`, logData);
  }
  
  // Send error to Sentry if configured (only non-operational or 5xx)
  if (hasSentry && (!operational || statusCode >= 500)) {
    Sentry.withScope((scope) => {
      scope.setTag('errorId', errorId);
      scope.setTag('correlationId', correlationId);
      scope.setTag('url', req.url);
      scope.setTag('method', req.method);
      scope.setTag('operational', String(operational));
      scope.setUser({ 
        id: (req as any).user?.id,
        email: (req as any).user?.email 
      });
      scope.setExtra('storeId', (req as any).storeId);
      Sentry.captureException(err);
    });
  }
  
  // Build response using error formatter
  const response = formatErrorResponse(err, errorId, isProduction);
  
  // Add correlationId for debugging
  (response.error as any).correlationId = correlationId;
  
  res.status(statusCode).json(response);
}
