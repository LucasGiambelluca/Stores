import { Router, type Router as RouterType } from 'express';
import { getBanners, saveBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banners.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router: RouterType = Router();

// Public route - get banners
router.get('/', getBanners);

// Admin routes - require authentication
router.post('/save', authMiddleware, adminMiddleware, saveBanners);
router.post('/', authMiddleware, adminMiddleware, createBanner);
router.put('/:id', authMiddleware, adminMiddleware, updateBanner);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBanner);

export default router;
