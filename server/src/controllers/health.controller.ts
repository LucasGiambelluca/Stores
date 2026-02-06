import { Request, Response } from 'express';
import { db } from '../db/drizzle.js';
import { sql } from 'drizzle-orm';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usedMB: number;
      totalMB: number;
      percentUsed: number;
    };
  };
}

const startTime = Date.now();

/**
 * Health Controller
 * Provides endpoints for monitoring application health and readiness
 */
export class HealthController {

  /**
   * GET /health
   * Full health check with all subsystem status
   */
  static async getHealth(_req: Request, res: Response) {
    const status = await HealthController.checkAllSystems();
    
    const httpStatus = status.status === 'healthy' ? 200 : 
                       status.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(status);
  }

  /**
   * GET /health/live
   * Liveness probe - returns 200 if the server is running
   * Used by Kubernetes/Docker to know if the container should be restarted
   */
  static async getLiveness(_req: Request, res: Response) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * GET /health/ready
   * Readiness probe - returns 200 if the server can accept traffic
   * Checks database connectivity
   */
  static async getReadiness(_req: Request, res: Response) {
    const dbCheck = await HealthController.checkDatabase();
    
    if (dbCheck.status === 'up') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: dbCheck,
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: dbCheck,
      });
    }
  }

  /**
   * Check all system components
   */
  private static async checkAllSystems(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Check database
    const dbCheck = await HealthController.checkDatabase();
    
    // Check memory
    const memoryCheck = HealthController.checkMemory();
    
    // Determine overall status
    let overallStatus: HealthStatus['status'] = 'healthy';
    
    if (dbCheck.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (memoryCheck.status === 'critical') {
      overallStatus = 'unhealthy';
    } else if (memoryCheck.status === 'warning') {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbCheck,
        memory: memoryCheck,
      },
    };
  }

  /**
   * Check database connectivity
   */
  private static async checkDatabase(): Promise<HealthStatus['checks']['database']> {
    const startMs = Date.now();
    
    try {
      // Simple query to check database is responding
      await db.execute(sql`SELECT 1`);
      const latencyMs = Date.now() - startMs;
      
      return {
        status: 'up',
        latencyMs,
      };
    } catch (error: any) {
      return {
        status: 'down',
        error: error.message || 'Database connection failed',
      };
    }
  }

  /**
   * Check memory usage
   */
  private static checkMemory(): HealthStatus['checks']['memory'] {
    const used = process.memoryUsage();
    const totalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const percentUsed = Math.round((usedMB / totalMB) * 100);
    
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    
    if (percentUsed > 90) {
      status = 'critical';
    } else if (percentUsed > 75) {
      status = 'warning';
    }
    
    return {
      status,
      usedMB,
      totalMB,
      percentUsed,
    };
  }
}
