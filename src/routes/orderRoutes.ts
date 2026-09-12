import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  markOrderPaymentReceived,
} from '../controllers/orderController';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth';

const router = Router();

// Public routes for Customer Order
router.post('/', createOrder);
router.get('/:id', getOrderById);

// Staff/Admin routes for Order Management & KDS
router.get('/', requireAuth, requireStaffOrAdmin, listOrders);
router.patch('/:id/status', requireAuth, requireStaffOrAdmin, updateOrderStatus);
router.patch('/:id/mark-paid', requireAuth, requireStaffOrAdmin, markOrderPaymentReceived);

export default router;
