/**
 * Typed Error Classes
 * 
 * Provides a hierarchy of error classes for consistent error handling.
 * All errors extend AppError which provides:
 * - Error code (machine-readable)
 * - HTTP status code
 * - Operational flag (expected vs programming errors)
 * - Additional details object
 * 
 * @skill resilience-error-architect
 */

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp,
      }
    };
  }
}

// ===========================================
// VALIDATION ERRORS (400)
// ===========================================

/**
 * Validation error - invalid input data
 * @example throw new ValidationError({ email: ['Email inválido'] })
 */
export class ValidationError extends AppError {
  constructor(fields: Record<string, string[]>) {
    super(
      'VALIDATION_ERROR',
      'Datos inválidos',
      400,
      true,
      { fields }
    );
  }
}

/**
 * Bad request - malformed request
 * @example throw new BadRequestError('Faltan campos requeridos')
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Solicitud inválida', details?: Record<string, unknown>) {
    super('BAD_REQUEST', message, 400, true, details);
  }
}

// ===========================================
// AUTHENTICATION ERRORS (401)
// ===========================================

/**
 * Authentication required or failed
 * @example throw new AuthError('Token expirado')
 */
export class AuthError extends AppError {
  constructor(message: string = 'No autenticado', code: string = 'AUTH_ERROR') {
    super(code, message, 401, true);
  }
}

/**
 * Invalid credentials
 */
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Credenciales inválidas', 'INVALID_CREDENTIALS');
  }
}

/**
 * Token expired or invalid
 */
export class TokenError extends AuthError {
  constructor(message: string = 'Token inválido') {
    super(message, 'TOKEN_ERROR');
  }
}

// ===========================================
// AUTHORIZATION ERRORS (403)
// ===========================================

/**
 * Permission denied
 * @example throw new ForbiddenError('Acceso denegado')
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado', details?: Record<string, unknown>) {
    super('FORBIDDEN', message, 403, true, details);
  }
}

/**
 * Admin access required
 */
export class AdminRequiredError extends ForbiddenError {
  constructor() {
    super('Se requiere acceso de administrador');
  }
}

/**
 * Password change required
 */
export class PasswordChangeRequiredError extends AppError {
  constructor() {
    super(
      'PASSWORD_CHANGE_REQUIRED',
      'Debes cambiar tu contraseña antes de continuar',
      403,
      true
    );
  }
}

// ===========================================
// NOT FOUND ERRORS (404)
// ===========================================

/**
 * Resource not found
 * @example throw new NotFoundError('Product', productId)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      `${resource} no encontrado`,
      404,
      true,
      id ? { resource, id } : { resource }
    );
  }
}

/**
 * Store not found or deleted
 */
export class StoreNotFoundError extends NotFoundError {
  constructor(storeId?: string) {
    super('Tienda', storeId);
  }
}

// ===========================================
// CONFLICT ERRORS (409)
// ===========================================

/**
 * Resource already exists
 * @example throw new ConflictError('Email ya registrado')
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, true, details);
  }
}

/**
 * Duplicate entry
 */
export class DuplicateError extends ConflictError {
  constructor(resource: string, field: string) {
    super(`${resource} con ese ${field} ya existe`, { resource, field });
  }
}

// ===========================================
// BUSINESS LOGIC ERRORS (422)
// ===========================================

/**
 * Business rule violation
 * @example throw new BusinessError('Stock insuficiente')
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR', details?: Record<string, unknown>) {
    super(code, message, 422, true, details);
  }
}

/**
 * Insufficient stock
 */
export class InsufficientStockError extends BusinessError {
  constructor(productId: string, requested: number, available: number) {
    super('Stock insuficiente', 'INSUFFICIENT_STOCK', {
      productId,
      requested,
      available,
    });
  }
}

/**
 * Order limit exceeded (license restriction)
 */
export class OrderLimitExceededError extends BusinessError {
  constructor(limit: number, current: number) {
    super(
      `Límite de órdenes alcanzado (${current}/${limit})`,
      'ORDER_LIMIT_EXCEEDED',
      { limit, current }
    );
  }
}

/**
 * Product limit exceeded (license restriction)
 */
export class ProductLimitExceededError extends BusinessError {
  constructor(limit: number, current: number) {
    super(
      `Límite de productos alcanzado (${current}/${limit})`,
      'PRODUCT_LIMIT_EXCEEDED',
      { limit, current }
    );
  }
}

/**
 * Invalid license
 */
export class LicenseError extends BusinessError {
  constructor(message: string = 'Licencia no válida') {
    super(message, 'LICENSE_ERROR');
  }
}

// ===========================================
// RATE LIMIT ERRORS (429)
// ===========================================

/**
 * Too many requests
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'RATE_LIMIT_EXCEEDED',
      'Demasiadas solicitudes, intentá más tarde',
      429,
      true,
      retryAfter ? { retryAfterSeconds: retryAfter } : undefined
    );
  }
}

// ===========================================
// SERVICE ERRORS (503)
// ===========================================

/**
 * External service unavailable (circuit breaker open)
 * @example throw new ServiceUnavailableError('MercadoPago')
 */
export class ServiceUnavailableError extends AppError {
  constructor(serviceName: string, retryAfter?: number) {
    super(
      'SERVICE_UNAVAILABLE',
      `Servicio temporalmente no disponible: ${serviceName}`,
      503,
      true,
      {
        service: serviceName,
        ...(retryAfter && { retryAfterSeconds: retryAfter }),
      }
    );
  }
}

// ===========================================
// INTERNAL ERRORS (500)
// ===========================================

/**
 * Internal server error (programming/unexpected error)
 * isOperational = false means this is a bug, not expected
 */
export class InternalError extends AppError {
  constructor(message: string = 'Error interno del servidor', originalError?: Error) {
    super('INTERNAL_ERROR', message, 500, false, 
      originalError ? { originalMessage: originalError.message } : undefined
    );
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Check if error is operational (expected) vs programming bug
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Check if error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Format error for API response
 * Hides internal details in production
 */
export function formatErrorResponse(
  error: Error, 
  errorId: string,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        errorId,
        timestamp: error.timestamp,
        ...(error.details && !isProduction && { details: error.details }),
      }
    };
  }

  // For non-AppError, hide message in production
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Error interno del servidor' : error.message,
      errorId,
      timestamp: new Date().toISOString(),
    }
  };
}
