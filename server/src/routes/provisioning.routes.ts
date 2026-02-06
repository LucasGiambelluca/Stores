import { Router, type Router as RouterType } from 'express';
import * as storesController from '../controllers/stores.controller.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router: RouterType = Router();

// Public routes for store provisioning

// GET /api/stores/check-domain?subdomain=foo
router.get('/check-domain', storesController.checkDomain);

// POST /api/stores - Initialize store creation (Public)
// Note: This might need a specific controller method if logic differs from admin creation
router.post('/', authLimiter, storesController.createStore); 

export default router;
