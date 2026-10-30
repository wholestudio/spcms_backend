import { Router } from 'express';
import { STAFF_ROLES } from '../common/constants/roles.js';
import { authenticate } from '../common/middleware/authenticate.js';
import { authorize } from '../common/middleware/authorize.js';
import { adminAuthRoutes } from '../modules/auth/index.js';

/**
 * CMS / admin surface for spcms_frontend.
 * Staff login is public under /auth; remaining admin routes require staff JWT.
 */
const router = Router();

router.use('/auth', adminAuthRoutes);
router.use(authenticate);
router.use(authorize(...STAFF_ROLES));

export default router;
