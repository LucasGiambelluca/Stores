import { Router, type Router as RouterType } from 'express';
import * as activationController from '../controllers/activation.controller.js';
import { LicenseService } from '../services/license.service.js';

const router: RouterType = Router();

// Public activation endpoint (no auth required for initial activation)
router.post('/activate', activationController.activateLicense);

// Check-in endpoint (can be public or require basic auth)
router.post('/checkin', activationController.checkIn);

// Get current license status
router.get('/status', activationController.getLicenseStatus);

// Get license usage stats (for dashboard)
router.get('/usage', async (req, res) => {
  try {
    // Get storeId from middleware (set by storeResolver)
    const storeId = req.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID not found in request' });
    }
    
    const usage = await LicenseService.getLicenseUsage(storeId);
    
    if (!usage) {
      return res.status(404).json({ error: 'No license found' });
    }
    
    res.json(usage);
  } catch (error) {
    console.error('Get license usage error:', error);
    res.status(500).json({ error: 'Failed to get license usage' });
  }
});

export default router;
