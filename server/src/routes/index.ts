import { Router, type Router as RouterType } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { saasMiddleware } from '../middleware/saas.middleware.js';
import { storeResolver } from '../middleware/storeResolver.middleware.js';
import { enforceProductLimit, enforceOrderLimit, getLicenseUsage } from '../middleware/licenseEnforcement.middleware.js';
import { uploadLimiter, orderLimiter, mothershipLimiter, authLimiter } from '../middleware/rateLimit.middleware.js';
import { validate, registerSchema, loginSchema, createOrderSchema, createProductSchema, updateProductSchema, createCategorySchema, updateCategorySchema, shippingQuoteSchema, createShipmentSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validation.middleware.js';
import { db } from '../db/drizzle.js';
import { sql } from 'drizzle-orm';
import { getCsrfToken, strictCsrfMiddleware } from '../middleware/csrf.middleware.js';

// Import controllers
import * as authController from '../controllers/auth.controller.js';
import * as ordersController from '../controllers/orders.controller.js';
import * as paymentsController from '../controllers/payments.controller.js';
import * as shippingController from '../controllers/shipping.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import * as productsController from '../controllers/products.controller.js';
import * as configController from '../controllers/config.controller.js';
import * as categoriesController from '../controllers/categories.controller.js';
import * as uploadController from '../controllers/upload.controller.js';
import * as reviewsController from '../controllers/reviews.controller.js';
import * as seoController from '../controllers/seo.controller.js';
import shippingConfigRouter from '../controllers/shipping-config.controller.js';
import * as modoController from '../controllers/modo.controller.js';
import * as setupController from '../controllers/setup.controller.js';
import * as centralController from '../controllers/central.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as cartController from '../controllers/cart.controller.js';
import * as stockController from '../controllers/stock.controller.js';
import licensesRoutes from './licenses.routes.js';
import activationRoutes from './activation.routes.js';
import storesRoutes from './stores.routes.js';
import aiRoutes from './ai.routes.js';
import bannersRoutes from './banners.routes.js';
import initRoutes from './init.routes.js';
import systemRoutes from './system.routes.js';

const router: RouterType = Router();

// Apply SaaS Middleware globally (it has internal exclusions)
router.use(saasMiddleware);

// Apply Store Resolver to all routes (detects store from subdomain/query param)
router.use(storeResolver);

// Apply CSRF protection (logs in dev, validates in prod)
router.use(strictCsrfMiddleware);

// CSRF token endpoint
router.get('/csrf-token', getCsrfToken);

// ============================================
// ACTIVATION ROUTES (Public)
// ============================================
router.use('/license', activationRoutes);

// License usage endpoint (for admin to see limits)
router.get('/license/usage', authMiddleware, async (req, res) => {
  if (!req.storeId) {
    return res.status(400).json({ error: 'Store context required' });
  }
  const usage = await getLicenseUsage(req.storeId);
  if (!usage) {
    return res.status(404).json({ error: 'No license found' });
  }
  res.json({ usage });
});

// ============================================
// MOTHERSHIP ROUTES (Super Admin Only)
// ============================================
router.use('/mothership', mothershipLimiter); // Apply strict limits to all mothership routes
router.use('/mothership/licenses', licensesRoutes);
router.use('/mothership/stores', storesRoutes);
router.use('/system', systemRoutes); // System settings (Sentry, SMTP, etc.)

// ============================================
// SAAS ROUTES (Public checkout + Mothership stats)
// ============================================
import saasRoutes from './saas.routes.js';
router.use('/saas', saasRoutes);

// ============================================
// STORE PROVISIONING ROUTES (Public)
// ============================================
import provisioningRoutes from './provisioning.routes.js';
router.use('/stores', provisioningRoutes);

// ============================================
// INIT ROUTE (Combined endpoint for fast initial load)
// ============================================
router.use('/init', initRoutes);

// ============================================
// CONFIG ROUTES (Public - Store resolved by middleware)
// ============================================
router.get('/config', configController.getStoreConfig);
router.get('/config/mp-key', configController.getMPPublicKey);

// Public setup route (only works if store is not configured yet)
router.post('/config/setup', configController.initialSetup);

// Admin config route (protected)
router.post('/admin/config', authMiddleware, adminMiddleware, configController.updateStoreConfig);

// ============================================
// AUTH ROUTES
// ============================================
router.post('/auth/register', authLimiter, validate(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.post('/auth/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/auth/refresh', authController.refresh); // Refresh token endpoint
router.get('/auth/me', authMiddleware, authController.me);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.put('/auth/password', authMiddleware, authController.changePassword);

// ============================================
// CATEGORIES ROUTES (Public)
// ============================================
router.get('/categories', categoriesController.getCategories);

// Admin category routes
router.post('/admin/categories', authMiddleware, adminMiddleware, validate(createCategorySchema), categoriesController.createCategory);
router.put('/admin/categories/:id', authMiddleware, adminMiddleware, validate(updateCategorySchema), categoriesController.updateCategory);
router.delete('/admin/categories/:id', authMiddleware, adminMiddleware, categoriesController.deleteCategory);

// ============================================
// PRODUCTS ROUTES (Public)
// ============================================
router.get('/products', productsController.getAllProducts);
router.get('/products/:id', productsController.getProduct);
router.post('/products/:id/view', productsController.trackView);
router.post('/products/:id/click', productsController.trackClick);
router.post('/products/check-stock', productsController.checkStockEndpoint);

// ============================================
// BANNERS ROUTES
// ============================================
router.use('/banners', bannersRoutes);

// Admin product routes
router.post('/admin/products', authMiddleware, adminMiddleware, enforceProductLimit, validate(createProductSchema), productsController.createProduct);
router.put('/admin/products/:id', authMiddleware, adminMiddleware, validate(updateProductSchema), productsController.updateProduct);
router.delete('/admin/products/:id', authMiddleware, adminMiddleware, productsController.deleteProduct);
router.post('/admin/products/seed', authMiddleware, adminMiddleware, enforceProductLimit, productsController.seedProducts);

// ============================================
// ORDERS ROUTES
// ============================================
router.post('/orders', orderLimiter, enforceOrderLimit, validate(createOrderSchema), ordersController.createOrder);
router.get('/orders/my', authMiddleware, ordersController.getUserOrders);
router.get('/orders/:id', ordersController.getOrder);
// Public receipt file upload (images + PDF) - for customers uploading payment proof
router.post('/upload/receipt', uploadLimiter, uploadController.uploadReceipt.single('file'), uploadController.uploadReceiptImage);
// Update order with receipt URL
router.post('/orders/:orderId/receipt', uploadLimiter, ordersController.uploadReceipt);

// Admin order routes
router.get('/admin/orders', authMiddleware, adminMiddleware, ordersController.getAllOrders);
router.put('/admin/orders/:id/status', authMiddleware, adminMiddleware, ordersController.updateOrderStatus);
router.get('/admin/orders/pending-receipts', authMiddleware, adminMiddleware, ordersController.getPendingReceipts);
router.post('/admin/orders/:id/verify-receipt', authMiddleware, adminMiddleware, ordersController.verifyReceipt);

// ============================================
// CART ROUTES
// ============================================
router.post('/cart/save', cartController.saveCart);

// ============================================
// PAYMENTS ROUTES
// ============================================
router.get('/payments/config', paymentsController.getMPConfig);
router.post('/payments/preference', paymentsController.createPreference);
router.post('/payments/create-intent', paymentsController.createIntent); // New endpoint for SaaS subscription
router.post('/payments/webhook', paymentsController.webhook);
router.get('/payments/status/:id', paymentsController.getPaymentStatus);

// ============================================
// SHIPPING ROUTES
// ============================================
// Quote and validation (public)
router.post('/shipping/quote', validate(shippingQuoteSchema), shippingController.getQuote);
router.get('/shipping/carriers', shippingController.getCarriers);
router.get('/shipping/validate/:postalCode', shippingController.validatePostalCode);

// Tracking (public)
router.get('/shipping/tracking/:trackingNumber', shippingController.getTrackingByNumber);
router.get('/shipping/tracking/order/:orderNumber', shippingController.getTrackingByOrder);

// Label generation and admin (protected)
router.post('/admin/shipping/create', authMiddleware, adminMiddleware, validate(createShipmentSchema), shippingController.createShipment);
router.get('/admin/shipping/label/:orderId', authMiddleware, adminMiddleware, shippingController.getLabel);
router.get('/admin/shipping/:orderId', authMiddleware, adminMiddleware, shippingController.getShipmentByOrder);

// ============================================
// ADMIN ROUTES - Customers & Reports
// ============================================
router.get('/admin/customers', authMiddleware, adminMiddleware, adminController.getAllCustomers);
router.get('/admin/customers/guests', authMiddleware, adminMiddleware, adminController.getGuestCustomers);
router.get('/admin/customers/:id', authMiddleware, adminMiddleware, adminController.getCustomerDetails);
router.get('/admin/reports/sales', authMiddleware, adminMiddleware, adminController.getSalesReport);
router.get('/admin/dashboard', authMiddleware, adminMiddleware, adminController.getDashboardStats);

// ============================================
// ANALYTICS ROUTES (Admin only)
// ============================================
router.get('/admin/analytics/dashboard', authMiddleware, adminMiddleware, analyticsController.getDashboard);

// ============================================
// STOCK MANAGEMENT ROUTES (Admin only)
// ============================================
router.get('/admin/stock/summary', authMiddleware, adminMiddleware, stockController.getStockSummary);
router.get('/admin/stock/low', authMiddleware, adminMiddleware, stockController.getLowStock);
router.get('/admin/stock/out-of-stock', authMiddleware, adminMiddleware, stockController.getOutOfStock);
router.get('/admin/stock/threshold', authMiddleware, adminMiddleware, stockController.getThreshold);
router.put('/admin/stock/threshold', authMiddleware, adminMiddleware, stockController.setThreshold);
router.post('/admin/stock/send-alert', authMiddleware, adminMiddleware, stockController.sendStockAlert);

// ============================================
// UPLOAD ROUTES (Admin only)
// ============================================
router.use('/upload', uploadLimiter); // Apply upload limits to all upload routes
router.post('/upload/product', authMiddleware, adminMiddleware, uploadController.upload.single('image'), uploadController.uploadProductImage);
router.post('/upload/products', authMiddleware, adminMiddleware, uploadController.upload.array('images', 10), uploadController.uploadProductImages);
router.post('/upload/banner', authMiddleware, adminMiddleware, uploadController.upload.single('image'), uploadController.uploadBannerImage);
router.delete('/upload', authMiddleware, adminMiddleware, uploadController.deleteImage);
router.get('/upload/config', authMiddleware, adminMiddleware, uploadController.checkConfig);

// ============================================
// HEALTH CHECK ROUTES (Comprehensive)
// ============================================
import healthRoutes from './health.routes.js';
router.use('/health', healthRoutes);

// ============================================
// REVIEWS ROUTES
// ============================================
// Public routes
router.get('/reviews/:productId', reviewsController.getProductReviews);
router.post('/reviews', reviewsController.createReview);

// Admin routes
router.get('/admin/reviews', authMiddleware, adminMiddleware, reviewsController.getAllReviews);
router.put('/admin/reviews/:id', authMiddleware, adminMiddleware, reviewsController.moderateReview);
router.delete('/admin/reviews/:id', authMiddleware, adminMiddleware, reviewsController.deleteReview);

// ============================================
// SEO ROUTES (sitemap.xml, robots.txt)
// ============================================
router.get('/sitemap.xml', seoController.getSitemap);
router.get('/robots.txt', seoController.getRobots);

// ============================================
// SHIPPING & PAYMENT CONFIG (Admin)
// ============================================
router.use('/admin', authMiddleware, adminMiddleware, shippingConfigRouter);

// Payments - Admin
router.get('/admin/payments/config', authMiddleware, adminMiddleware, paymentsController.getFullConfig);
router.post('/admin/payments/config', authMiddleware, adminMiddleware, paymentsController.updateConfig);

// Payments - MODO
router.post('/payments/modo/intention', modoController.createPaymentIntention);
router.post('/payments/modo/webhook', modoController.webhook);
router.get('/payments/modo/config', modoController.getModoConfig);

// --- SaaS Routes ---

// Setup (Public until completed)
router.post('/setup', setupController.setupStore);
router.get('/setup/status', setupController.checkSetupStatus);

// Central Mothership (Mock)
router.get('/central/validate', centralController.validateLicense);
router.post('/central/log', centralController.receiveLog);
router.post('/central/status', centralController.setStoreStatus); // Super Admin
router.post('/saas/reset-password', centralController.remoteResetPassword); // Super Admin

// ============================================
// AI ROUTES
// ============================================
router.use('/ai', aiRoutes);

// ============================================
// LANDING CONFIG ROUTES (CMS)
// ============================================
import * as landingController from '../controllers/landing.controller.js';
router.get('/landing-config', landingController.getLandingConfig);
router.put('/landing-config', authMiddleware, adminMiddleware, landingController.updateLandingConfig);

// ============================================
// PRODUCT PAGE BUILDER ROUTES
// ============================================
import productPageRoutes from './product-page.routes.js';
router.use('/product-page-config', productPageRoutes);

export default router;
