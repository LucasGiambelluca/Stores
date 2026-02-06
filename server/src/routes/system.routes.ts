/**
 * System Settings Routes
 * API routes for global configuration management
 * Only accessible by super_admin users
 */

import { Router, type Router as RouterType } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth.js';
import * as settingsController from '../controllers/system-settings.controller.js';

const router: RouterType = Router();

// All routes require super_admin authentication
router.use(authMiddleware);
router.use(requireSuperAdmin);

// GET /api/system/settings - Get current settings
router.get('/settings', settingsController.getSettings);

// PUT /api/system/settings - Update settings
router.put('/settings', settingsController.updateSettings);

// POST /api/system/settings/test-smtp - Test SMTP connection
router.post('/settings/test-smtp', settingsController.testSmtp);

// POST /api/system/settings/test-sentry - Validate Sentry DSN
router.post('/settings/test-sentry', settingsController.testSentry);

// GET /api/system/logs - Get system audit logs
import { getSystemLogs } from '../controllers/admin.controller.js';
router.get('/logs', getSystemLogs);

export default router;
