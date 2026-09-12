import { Router } from 'express';
import { callWaiter, listPendingWaiterCalls, attendWaiterCall } from '../controllers/waiterController';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth';

const router = Router();

// Customer route to call waiter
router.post('/call', callWaiter);

// Staff/Admin routes
router.get('/pending', requireAuth, requireStaffOrAdmin, listPendingWaiterCalls);
router.patch('/:id/attend', requireAuth, requireStaffOrAdmin, attendWaiterCall);

export default router;
