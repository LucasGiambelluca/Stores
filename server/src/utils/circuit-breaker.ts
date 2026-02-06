/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects the system from cascading failures when external services fail.
 * When failures exceed threshold, circuit "opens" and fails fast without
 * attempting the operation.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, allows limited requests
 * 
 * @skill resilience-error-architect
 */

import { ServiceUnavailableError } from '../errors/index.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting recovery (OPEN -> HALF_OPEN) */
  resetTimeout: number;
  /** Number of successful calls needed to close circuit */
  successThreshold: number;
  /** Name for logging */
  name: string;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
}

const defaultOptions: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new ServiceUnavailableError(
          this.options.name,
          Math.ceil((this.options.resetTimeout - (Date.now() - this.lastFailureTime)) / 1000)
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful call
   */
  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  /**
   * Record a failed call
   */
  private onFailure(): void {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Back to open on any failure
      this.transitionTo('OPEN');
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.successes = 0;
      
      console.log(`🔌 [CircuitBreaker:${this.options.name}] ${oldState} → ${newState}`);
      
      if (this.options.onStateChange) {
        this.options.onStateChange(oldState, newState, this.options.name);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats(): { state: CircuitState; failures: number; successes: number } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.transitionTo('CLOSED');
  }
}

// ===========================================
// PRE-CONFIGURED CIRCUIT BREAKERS
// ===========================================

/**
 * Circuit breaker for MercadoPago integration
 */
export const mercadoPagoCircuit = new CircuitBreaker({
  name: 'MercadoPago',
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
});

/**
 * Circuit breaker for Cloudinary integration
 */
export const cloudinaryCircuit = new CircuitBreaker({
  name: 'Cloudinary',
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
});

/**
 * Circuit breaker for shipping providers
 */
export const shippingCircuit = new CircuitBreaker({
  name: 'Shipping',
  failureThreshold: 3,
  resetTimeout: 45000, // 45 seconds
  successThreshold: 2,
});

/**
 * Circuit breaker for AI services (Replicate, HuggingFace)
 */
export const aiCircuit = new CircuitBreaker({
  name: 'AI',
  failureThreshold: 3,
  resetTimeout: 120000, // 2 minutes (AI can be slow to recover)
  successThreshold: 1,
});
