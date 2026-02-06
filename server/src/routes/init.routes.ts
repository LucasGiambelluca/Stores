/**
 * Init Routes - Combined endpoint for fast store initialization
 */

import { Router, type Router as RouterType } from 'express';
import { getInitData } from '../controllers/init.controller.js';

const router: RouterType = Router();

// GET /api/init - Get all initial store data in a single request
router.get('/', getInitData);

export default router;
