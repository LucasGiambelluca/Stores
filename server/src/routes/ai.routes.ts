
import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';

const router: Router = Router();

// Virtual Try-On Endpoint
// Public endpoint for Storefront Virtual Try-On
router.post('/try-on', (req, res) => aiController.generateTryOn(req, res));

// AI Status Endpoint - Check if AI is available for this store
router.get('/status', (req, res) => aiController.checkStatus(req, res));

export default router;
