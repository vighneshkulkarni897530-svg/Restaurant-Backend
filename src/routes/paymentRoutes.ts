import { Router } from 'express';
import { createRazorpayOrder, verifyPayment, listPayments } from '../controllers/paymentController';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth';

const router = Router();

// Public routes for Customer Checkout Payment
router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

// Staff/Admin route for Payment Transactions log
router.get('/', requireAuth, requireStaffOrAdmin, listPayments);

export default router;
