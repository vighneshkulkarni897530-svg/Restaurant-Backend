import { Router } from 'express';
import { getDashboardOverview, getSalesReport } from '../controllers/reportController';
import { requireAuth, requireStaffOrAdmin, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/overview', requireAuth, requireStaffOrAdmin, getDashboardOverview);
router.get('/sales', requireAuth, requireAdmin, getSalesReport);

export default router;
