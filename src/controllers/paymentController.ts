import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../lib/prisma';
import { emitOrderStatusUpdate } from '../lib/socket';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance: any = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes('sampleKey')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.log('Razorpay live instance not initialized; using simulation mode.');
  }
}

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    if (razorpayInstance) {
      const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency,
        receipt: receipt || `rec_${Date.now()}`,
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);
      return res.status(200).json({
        success: true,
        isSimulation: false,
        key: RAZORPAY_KEY_ID,
        order: razorpayOrder,
      });
    } else {
      // Simulation / Test gateway response
      return res.status(200).json({
        success: true,
        isSimulation: true,
        key: 'rzp_test_simulation',
        order: {
          id: `order_sim_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency,
          receipt: receipt || `rec_${Date.now()}`,
          status: 'created',
        },
      });
    }
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({ success: false, message: 'Failed to initialize payment', error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    let isValid = true;

    // Verify signature if live credentials exist
    if (razorpayInstance && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification' });
    }

    // Update Order & Payment record
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
        },
        include: {
          table: true,
          items: true,
          payment: true,
        },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'COMPLETED',
            providerPaymentId: razorpayPaymentId || `sim_pay_${Date.now()}`,
            providerOrderId: razorpayOrderId || `sim_ord_${Date.now()}`,
            paymentMethod: paymentMethod || 'UPI / Online Card',
          },
        });
      }

      return order;
    });

    emitOrderStatusUpdate(orderId, updatedOrder);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and recorded successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

export const listPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          include: {
            table: {
              select: { tableNumber: true, section: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({ success: true, payments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list payments', error: error.message });
  }
};
