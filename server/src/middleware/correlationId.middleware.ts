/**
 * Correlation ID Middleware
 * 
 * Assigns a unique correlation ID to each request for tracing across
 * the system. If the client sends X-Correlation-ID header, it's reused;
 * otherwise a new one is generated.
 * 
 * Benefits:
 * - Trace a request through logs, services, and error reports
 * - Match user-reported errors to specific request logs
 * - Debug distributed flows
 * 
 * @skill resilience-error-architect
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Header name (lowercase for consistency)
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Extend Express Request to include correlationId
 */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Generate a short, readable correlation ID
 * Format: req_<timestamp_base36>_<random_suffix>
 * Example: req_m1abc_x7k2
 */
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomUUID().substring(0, 4);
  return `req_${timestamp}_${random}`;
}

/**
 * Middleware that assigns or extracts correlation ID
 * 
 * Usage:
 *   app.use(correlationIdMiddleware);
 *   // Then in any handler:
 *   console.log(req.correlationId); // "req_m1abc_x7k2"
 */
export function correlationIdMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Check if client sent a correlation ID
  const existingId = req.headers[CORRELATION_ID_HEADER] as string | undefined;
  
  // Use existing or generate new
  const correlationId = existingId || generateCorrelationId();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Echo back in response headers (useful for debugging)
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  
  next();
}

/**
 * Create a child correlation ID for sub-operations
 * Format: parent_child
 * Example: req_m1abc_x7k2_1
 */
export function createChildCorrelationId(parentId: string, index: number = 1): string {
  return `${parentId}_${index}`;
}

/**
 * Extract correlation ID from request or use fallback
 */
export function getCorrelationId(req: Request): string {
  return req.correlationId || 'no-correlation-id';
}
