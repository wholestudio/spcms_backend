import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import customerRoutes from './customer.routes.js';
import healthRoutes from './health.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use(healthRoutes);
router.use('/public', publicRoutes);
router.use('/customer', customerRoutes);
router.use('/admin', adminRoutes);

export default router;
