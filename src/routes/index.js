import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import customerRoutes from './customer.routes.js';
import healthRoutes from './health.routes.js';
import publicRoutes from './public.routes.js';
import mediaRoutes from '../modules/media/routes.js';
import { routes as authRoutes } from '../modules/auth/index.js';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/customer', customerRoutes);
router.use('/admin', adminRoutes);
router.use('/media', mediaRoutes);

export default router;
