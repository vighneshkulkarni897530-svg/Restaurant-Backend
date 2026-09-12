import { Router } from 'express';
import { login, getMe, listStaff, createStaff } from '../controllers/authController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.get('/staff', requireAuth, requireAdmin, listStaff);
router.post('/staff', requireAuth, requireAdmin, createStaff);

export default router;
