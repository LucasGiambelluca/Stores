/**
 * Health Check Routes
 * 
 * Provides comprehensive health status for monitoring and orchestration.
 * 
 * Endpoints:
 * - GET /api/health - Basic liveness check
 * - GET /api/health/ready - Readiness check (includes dependencies)
 * - GET /api/health/detailed - Full stats (admin only)
 * 
 * @skill devops-orchestrator
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { sql } from 'drizzle-orm';
import { cache } from '../services/cache.service.js';
import { mercadoPagoCircuit, cloudinaryCircuit, shippingCircuit, aiCircuit } from '../utils/circuit-breaker.js';

const router: Router = Router();

// Track server start time
const startTime = Date.now();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

interface DependencyStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

/**
 * GET /api/health
 * Basic liveness check - returns 200 if server is running
 */
router.get('/', (_req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
  };
  
  res.json(health);
});

/**
 * GET /api/health/ready
 * Readiness check - verifies critical dependencies
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const dependencies: DependencyStatus[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Check database connection
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;
    
    dependencies.push({
      name: 'database',
      status: 'up',
      latency: dbLatency,
    });
  } catch (error) {
    dependencies.push({
      name: 'database',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'unhealthy';
  }
  
  // Check circuit breaker states
  const circuits = [
    { name: 'mercadopago', breaker: mercadoPagoCircuit },
    { name: 'cloudinary', breaker: cloudinaryCircuit },
    { name: 'shipping', breaker: shippingCircuit },
    { name: 'ai', breaker: aiCircuit },
  ];
  
  for (const { name, breaker } of circuits) {
    const state = breaker.getState();
    dependencies.push({
      name: `circuit:${name}`,
      status: state === 'CLOSED' ? 'up' : state === 'HALF_OPEN' ? 'degraded' : 'down',
      message: state,
    });
    
    if (state === 'OPEN') {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }
  }
  
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    dependencies,
  });
});

/**
 * GET /api/health/detailed
 * Detailed health info including memory, cache stats, etc.
 * Should be protected in production!
 */
router.get('/detailed', async (req: Request, res: Response) => {
  // Memory usage
  const memUsage = process.memoryUsage();
  const memoryMB = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
  };
  
  // Cache stats
  const cacheStats = cache.stats();
  
  // Circuit breaker stats
  const circuitStats = {
    mercadopago: mercadoPagoCircuit.getStats(),
    cloudinary: cloudinaryCircuit.getStats(),
    shipping: shippingCircuit.getStats(),
    ai: aiCircuit.getStats(),
  };
  
  // DB check with latency
  let dbStatus: DependencyStatus;
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbStatus = { name: 'database', status: 'up', latency: Date.now() - start };
  } catch (error) {
    dbStatus = { 
      name: 'database', 
      status: 'down', 
      message: error instanceof Error ? error.message : 'Unknown' 
    };
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    node: process.version,
    platform: process.platform,
    
    memory: memoryMB,
    
    cache: {
      entries: cacheStats.size,
      keys: cacheStats.keys.slice(0, 10), // First 10 keys only
    },
    
    circuits: circuitStats,
    
    database: dbStatus,
    
    correlationId: req.correlationId,
  });
});

export default router;
