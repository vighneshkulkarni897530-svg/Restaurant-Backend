import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0);

    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
      },
    });

    const totalTables = await prisma.table.count();
    const occupiedTables = await prisma.table.count({ where: { status: 'OCCUPIED' } });

    // Status Breakdown
    const statusCounts = {
      NEW: await prisma.order.count({ where: { status: 'NEW' } }),
      ACCEPTED: await prisma.order.count({ where: { status: 'ACCEPTED' } }),
      PREPARING: await prisma.order.count({ where: { status: 'PREPARING' } }),
      READY: await prisma.order.count({ where: { status: 'READY' } }),
      SERVED: await prisma.order.count({ where: { status: 'SERVED' } }),
      COMPLETED: await prisma.order.count({ where: { status: 'COMPLETED' } }),
      CANCELLED: await prisma.order.count({ where: { status: 'CANCELLED' } }),
    };

    // Pending waiter calls
    const pendingCalls = await prisma.waiterCall.count({ where: { status: 'PENDING' } });

    // Recent 5 orders
    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        table: { select: { tableNumber: true, section: true } },
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      stats: {
        todayOrdersCount: todayOrders.length,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        activeOrdersCount,
        totalTables,
        occupiedTables,
        tableOccupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
        averageOrderValue: todayOrders.length > 0 ? parseFloat((todayRevenue / todayOrders.length).toFixed(2)) : 0,
        statusCounts,
        pendingCalls,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error('Error retrieving dashboard overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve overview stats', error: error.message });
  }
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const allCompletedOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Group by date (past 7 days)
    const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[dateKey] = { date: displayLabel, revenue: 0, orders: 0 };
    }

    allCompletedOrders.forEach((order) => {
      const orderDate = order.createdAt.toISOString().split('T')[0];
      if (dailyMap[orderDate]) {
        dailyMap[orderDate].revenue += order.total;
        dailyMap[orderDate].orders += 1;
      }
    });

    const salesTrend = Object.values(dailyMap);

    // 2. Top Selling Dishes
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    allCompletedOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue += item.itemTotal;
      });
    });

    const topDishes = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Table Performance
    const tableMap: Record<string, { tableNumber: string; section: string; orders: number; revenue: number }> = {};
    allCompletedOrders.forEach((o) => {
      const tNum = o.table?.tableNumber || 'Unknown';
      if (!tableMap[tNum]) {
        tableMap[tNum] = {
          tableNumber: tNum,
          section: o.table?.section || 'Main Dining',
          orders: 0,
          revenue: 0,
        };
      }
      tableMap[tNum].orders += 1;
      tableMap[tNum].revenue += o.total;
    });

    const tablePerformance = Object.values(tableMap).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = allCompletedOrders.reduce((acc, o) => acc + o.total, 0);

    return res.status(200).json({
      success: true,
      report: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPaidOrders: allCompletedOrders.length,
        salesTrend,
        topDishes,
        tablePerformance,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate sales report', error: error.message });
  }
};
