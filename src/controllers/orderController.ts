import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { emitNewOrder, emitOrderStatusUpdate } from '../lib/socket';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      qrToken,
      tableId,
      items,
      customerName,
      customerPhone,
      notes,
      paymentMethod = 'ONLINE_RAZORPAY',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    // Resolve Table
    let table = null;
    if (qrToken) {
      table = await prisma.table.findUnique({ where: { qrToken } });
    } else if (tableId) {
      table = await prisma.table.findUnique({ where: { id: tableId } });
    }

    if (!table) {
      return res.status(404).json({ success: false, message: 'Valid table not found for this order.' });
    }

    if (table.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Table is currently inactive.' });
    }

    // Fetch MenuItem details from DB to calculate true pricing
    const itemIds = items.map((i: any) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    const itemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // Validate availability and calculate subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = itemMap.get(item.menuItemId);
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Invalid item selected (ID: ${item.menuItemId})` });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Dish "${dbItem.name}" is currently sold out.` });
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = dbItem.price;
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        quantity,
        unitPrice,
        itemTotal,
        specialInstructions: item.specialInstructions || null,
      });
    }

    // Get tax and service charge percentages from Hotel Setting
    const hotelSetting = await prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    const taxRate = hotelSetting?.taxRatePercent ?? 5.0;
    const serviceRate = hotelSetting?.serviceChargePercent ?? 2.5;

    const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const serviceCharge = parseFloat(((subtotal * serviceRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + tax + serviceCharge).toFixed(2));

    // Generate Order Number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${1000 + orderCount + 1}`;

    // Execute in Prisma Transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          customerName: customerName || 'Guest Diner',
          customerPhone: customerPhone || null,
          notes: notes || null,
          status: 'NEW',
          paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID', // In simulation mode, online is instantly verified
          subtotal,
          tax,
          serviceCharge,
          total,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              provider: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE_RAZORPAY',
              amount: total,
              status: paymentMethod === 'CASH' ? 'PENDING' : 'COMPLETED',
              paymentMethod: paymentMethod === 'CASH' ? 'Cash at Table' : 'UPI / Online Card',
              providerOrderId: `order_sim_${Date.now()}`,
              providerPaymentId: `pay_sim_${Date.now()}`,
            },
          },
        },
        include: {
          table: {
            select: { id: true, tableNumber: true, section: true },
          },
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, imageUrl: true, isVeg: true },
              },
            },
          },
          payment: true,
        },
      });

      // Update table occupancy status
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });

      return newOrder;
    });

    // Broadcast Real-time socket event
    emitNewOrder(order);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: {
          select: { id: true, tableNumber: true, section: true, qrToken: true },
        },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true, isVeg: true, preparationTimeMin: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const hotelSetting = await prisma.hotelSetting.findUnique({ where: { id: 'default' } });

    return res.status(200).json({ success: true, order, hotel: hotelSetting });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details', error: error.message });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const { status, tableId, date, limit = '50' } = req.query;

    const whereClause: any = {};

    if (status && status !== 'all') {
      if (typeof status === 'string' && status.includes(',')) {
        whereClause.status = { in: status.split(',') };
      } else {
        whereClause.status = status as string;
      }
    }

    if (tableId && tableId !== 'all') {
      whereClause.tableId = tableId as string;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: {
          select: { id: true, tableNumber: true, section: true },
        },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true, isVeg: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 200,
    });

    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list orders', error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: {
          select: { id: true, tableNumber: true, section: true },
        },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true, isVeg: true },
            },
          },
        },
        payment: true,
      },
    });

    // If order is COMPLETED or CANCELLED, check if any other active orders exist on the table
    if (['COMPLETED', 'CANCELLED'].includes(status)) {
      const remainingActiveOrders = await prisma.order.count({
        where: {
          tableId: updatedOrder.tableId,
          status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
        },
      });

      if (remainingActiveOrders === 0) {
        await prisma.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    // Broadcast status change in real time to customer & staff
    emitOrderStatusUpdate(id, updatedOrder);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

export const markOrderPaymentReceived = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { paymentStatus: 'PAID' },
        include: { payment: true },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'COMPLETED' },
        });
      }

      return order;
    });

    emitOrderStatusUpdate(id, updated);

    return res.status(200).json({ success: true, message: 'Payment marked as received', order: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to mark payment received', error: error.message });
  }
};
