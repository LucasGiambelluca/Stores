import { Router, type Router as RouterType } from 'express';
import * as licensesController from '../controllers/licenses.controller.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router: RouterType = Router();

// All license operations require super admin authentication
router.use(authenticateToken, requireSuperAdmin);

// CRUD operations
router.post('/', licensesController.createLicense);
router.get('/', licensesController.getLicenses);
router.get('/stats', licensesController.getLicenseStats);
router.get('/:serial', licensesController.getLicense);
router.put('/:serial', licensesController.updateLicense);
router.delete('/:serial', licensesController.deleteLicense);

// Bulk operations
router.post('/bulk-delete', licensesController.bulkDeleteLicenses);

export default router;
