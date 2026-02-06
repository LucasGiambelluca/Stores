import { Router, type Router as RouterType } from 'express';
import * as storesController from '../controllers/stores.controller.js';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth.js';

const router: RouterType = Router();

// All stores routes require authentication + super_admin role
router.use(authMiddleware);
router.use(requireSuperAdmin);

// GET /api/stores - List all stores
router.get('/', storesController.getAllStores);

// GET /api/stores/stats - Get global dashboard stats
router.get('/stats', storesController.getGlobalStoreStats);

// GET /api/stores/:id - Get store by ID
router.get('/:id', storesController.getStoreById);

// POST /api/stores - Create new store
router.post('/', storesController.createStore);

// POST /api/stores/bulk-delete - Bulk delete stores
router.post('/bulk-delete', storesController.bulkDeleteStores);

// PATCH /api/stores/:id - Update store
router.patch('/:id', storesController.updateStore);

// DELETE /api/stores/:id - Delete store
router.delete('/:id', storesController.deleteStore);

// GET /api/stores/:id/stats - Get store statistics
router.get('/:id/stats', storesController.getStoreStats);

// GET /api/stores/:id/admins - Get admin users of a store
router.get('/:id/admins', storesController.getStoreAdmins);

// POST /api/stores/:id/reset-password - Reset admin password
router.post('/:id/reset-password', storesController.resetAdminPassword);

// POST /api/stores/:id/assign-license - Assign license to store
router.post('/:id/assign-license', storesController.assignLicense);

export default router;
