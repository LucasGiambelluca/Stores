/**
 * Retry Utility with Exponential Backoff
 * 
 * Automatically retries failed operations with increasing delays.
 * Works well with circuit breaker for transient failures.
 * 
 * @skill resilience-error-architect
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds (before exponential growth) */
  baseDelay: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Multiplier for exponential backoff (default: 2) */
  factor: number;
  /** Add randomness to delay (jitter) to prevent thundering herd */
  jitter: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
};

/**
 * Default function to check if error is retryable
 * Retryable: network errors, 5xx server errors, timeouts
 * Not retryable: 4xx client errors (except 429)
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || 
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('econnreset') ||
        message.includes('socket hang up')) {
      return true;
    }
    
    // Check for HTTP status codes
    const anyError = error as any;
    if (anyError.status || anyError.statusCode || anyError.response?.status) {
      const status = anyError.status || anyError.statusCode || anyError.response?.status;
      // 429 Too Many Requests is retryable
      // 5xx Server errors are retryable
      return status === 429 || (status >= 500 && status < 600);
    }
  }
  
  // When in doubt, don't retry (avoid retrying business logic errors)
  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  // Exponential: baseDelay * factor^attempt
  const exponentialDelay = options.baseDelay * Math.pow(options.factor, attempt);
  
  // Cap at maxDelay
  let delay = Math.min(exponentialDelay, options.maxDelay);
  
  // Add jitter (random 0-100% of delay)
  if (options.jitter) {
    delay = delay * (0.5 + Math.random());
  }
  
  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 * 
 * @example
 * const result = await withRetry(
 *   () => fetchFromAPI(),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  const isRetryable = opts.isRetryable || defaultIsRetryable;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = attempt < opts.maxRetries && isRetryable(error);
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, opts);
      
      // Notify about retry
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error, delay);
      } else {
        console.log(`🔄 Retry ${attempt + 1}/${opts.maxRetries} after ${delay}ms...`);
      }
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper with pre-configured options
 * 
 * @example
 * const retryableAPI = createRetryWrapper({ maxRetries: 5 });
 * const result = await retryableAPI(() => fetchFromAPI());
 */
export function createRetryWrapper(options: Partial<RetryOptions> = {}) {
  return <T>(fn: () => Promise<T>, additionalOptions: Partial<RetryOptions> = {}): Promise<T> => {
    return withRetry(fn, { ...options, ...additionalOptions });
  };
}

// ===========================================
// COMBINED CIRCUIT BREAKER + RETRY
// ===========================================

import { CircuitBreaker } from './circuit-breaker.js';

/**
 * Execute with both circuit breaker and retry protection
 * 
 * Order: Circuit Breaker (outer) → Retry (inner)
 * - Circuit breaker prevents calling a known-failing service
 * - Retry handles transient failures within a healthy service
 * 
 * @example
 * const result = await withResilience(
 *   mercadoPagoCircuit,
 *   () => mercadoPago.createPreference(data),
 *   { maxRetries: 2 }
 * );
 */
export async function withResilience<T>(
  circuitBreaker: CircuitBreaker,
  fn: () => Promise<T>,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  return circuitBreaker.execute(() => withRetry(fn, retryOptions));
}
