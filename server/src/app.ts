import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isProduction } from './env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { correlationIdMiddleware, CORRELATION_ID_HEADER } from './middleware/correlationId.middleware.js';
import { globalLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import { HealthController } from './controllers/health.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app: Express = express();

// Trust proxy (required for X-Forwarded-For to work behind load balancers/proxies)
app.set('trust proxy', true);

// ============================================
// HEALTH CHECK ENDPOINTS (before any rate limiting)
// ============================================
// These must be accessible even during high load or shutdown
app.get('/health', HealthController.getHealth);
app.get('/health/live', HealthController.getLiveness);
app.get('/health/ready', HealthController.getReadiness);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// HTTPS Enforcement - Redirect HTTP to HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (proto === 'http') {
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      console.log(`🔒 Redirecting HTTP to HTTPS: ${httpsUrl}`);
      return res.redirect(301, httpsUrl);
    }
    next();
  });
  
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });
}

// Helmet - Secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://sdk.mercadopago.com",
        "https://http2.mlstatic.com",
        "https://www.googletagmanager.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://http2.mlstatic.com",
        "https://*.mercadolibre.com",
      ],
      connectSrc: [
        "'self'",
        "https://api.mercadopago.com",
        "https://*.mercadopago.com",
        "https://api.cloudinary.com",
        "https://*.sentry.io",
        ...(isProduction ? [] : ["http://localhost:*", "ws://localhost:*"]),
      ],
      frameSrc: [
        "'self'",
        "https://*.mercadopago.com",
        "https://www.mercadopago.com.ar",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
}));

// Rate Limiters
app.use(globalLimiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

app.use(correlationIdMiddleware);

// CORS
const allowedOrigins = [
  env.STORE_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3005',
];
const productionDomainPattern = /^https:\/\/([a-z0-9-]+\.)?tiendita\.app$/;
const vercelDomainPattern = /^https:\/\/.*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (productionDomainPattern.test(origin)) return callback(null, true);
    if (vercelDomainPattern.test(origin)) return callback(null, true);
    if (!isProduction && origin.includes('localhost')) return callback(null, true);
    
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Id', 'X-Store-Domain', CORRELATION_ID_HEADER],
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply auth limiter to login/register routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api', apiRoutes);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint (basic info)
app.get('/', (req, res) => {
  res.json({
    name: 'Tienda API',
    version: '1.0.0',
    status: 'running',
    healthCheck: '/health',
  });
});

// Error handling
app.use(errorHandler);

export default app;
