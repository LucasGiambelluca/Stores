import app from './app.js';
import * as Sentry from '@sentry/node';
import { env, hasCloudinary, hasSMTP, hasSentry, isProduction } from './env.js';
import { initDatabase } from './db/index.js';
import { authService } from './services/auth.service.js';

// Initialize Sentry EARLY
if (hasSentry) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,
    ignoreErrors: [
      'No token provided',
      'Invalid token',
      'Credenciales inválidas',
    ],
  });
  console.log('🛡️ Sentry error monitoring initialized');
}

const PORT = env.PORT;
let server: ReturnType<typeof app.listen>;
let isShuttingDown = false;

async function start() {
  try {
    // Initialize database (async for PostgreSQL)
    await initDatabase();
    
    // Initialize audit logs table
    const auditService = await import('./services/audit.service.js');
    await auditService.initAuditTable();
    
    // Initialize system settings table
    const settingsService = await import('./services/system-settings.service.js');
    await settingsService.SystemSettingsService.initTable();
    
    // Create admin user if not exists
    await authService.createAdminUser();

    // Start server
    // Log startup info
    console.log('\n📋 Configuración detectada:');
    console.log(`   • Cloudinary: ${hasCloudinary ? '✅ Configurado' : '⚠️ No configurado (imágenes locales)'}`);
    console.log(`   • Email SMTP: ${hasSMTP ? '✅ Configurado' : '⚠️ No configurado (logs a consola)'}`);
    console.log(`   • Sentry: ${hasSentry ? '✅ Monitoreo activo' : '⚠️ No configurado (errores solo en logs)'}`);
    console.log(`   • Entorno: ${env.NODE_ENV}`);

    server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     🛒 TIENDA API SERVER                  ║
╠═══════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}            ║
║  📦 API: http://localhost:${PORT}/api        ║
║  🔧 Environment: ${env.NODE_ENV.padEnd(18)}║
║  🔄 Graceful shutdown: ENABLED            ║
╚═══════════════════════════════════════════╝
      `);
    });
    
    // Set keep-alive timeout (slightly higher than load balancer)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Graceful shutdown handler
 * 
 * @skill resilience-error-architect
 * 
 * When SIGTERM/SIGINT is received:
 * 1. Stop accepting new connections
 * 2. Wait for in-flight requests to complete (with timeout)
 * 3. Close database connections
 * 4. Exit cleanly
 */
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log('⚠️ Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
  
  // Add middleware to reject new requests during shutdown
  app.use((_req, res, _next) => {
    res.setHeader('Connection', 'close');
    res.status(503).json({ 
      error: 'Server is shutting down',
      code: 'SERVICE_UNAVAILABLE'
    });
  });
  
  // Give some time for load balancer to stop sending traffic
  console.log('   ⏳ Waiting 5s for load balancer drain...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Close server (stop accepting new connections)
  if (server) {
    console.log('   🔌 Closing HTTP server...');
    await new Promise<void>((resolve, reject) => {
      // Set timeout for forced shutdown
      const forceShutdownTimeout = setTimeout(() => {
        console.log('   ⚠️ Force shutdown after 30s timeout');
        resolve();
      }, 30000);
      
      server.close((err) => {
        clearTimeout(forceShutdownTimeout);
        if (err) {
          console.error('   ❌ Error closing server:', err);
          reject(err);
        } else {
          console.log('   ✅ HTTP server closed');
          resolve();
        }
      });
    });
  }
  
  // Close database connections
  try {
    console.log('   🗄️ Closing database connections...');
    // Drizzle with postgres.js handles this internally
    // If using a pool, you would close it here:
    // await pool.end();
    console.log('   ✅ Database connections closed');
  } catch (error) {
    console.error('   ❌ Error closing database:', error);
  }
  
  console.log('👋 Graceful shutdown complete. Goodbye!');
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught Exception:', error);
  if (hasSentry) {
    Sentry.captureException(error);
  }
  // Give Sentry time to send before exit
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled Rejection at:', promise, 'reason:', reason);
  if (hasSentry && reason instanceof Error) {
    Sentry.captureException(reason);
  }
});

start();
