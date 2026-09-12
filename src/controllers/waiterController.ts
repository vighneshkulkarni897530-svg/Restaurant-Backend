import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { emitWaiterCall } from '../lib/socket';

export const callWaiter = async (req: Request, res: Response) => {
  try {
    const { tableId, qrToken, requestType = 'CALL_WAITER', notes } = req.body;

    let targetTable = null;
    if (qrToken) {
      targetTable = await prisma.table.findUnique({ where: { qrToken } });
    } else if (tableId) {
      targetTable = await prisma.table.findUnique({ where: { id: tableId } });
    }

    if (!targetTable) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const waiterCall = await prisma.waiterCall.create({
      data: {
        tableId: targetTable.id,
        requestType,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        table: {
          select: { tableNumber: true, section: true },
        },
      },
    });

    emitWaiterCall(waiterCall);

    return res.status(201).json({
      success: true,
      message: 'Staff has been notified. Someone will assist you shortly at your table.',
      waiterCall,
    });
  } catch (error: any) {
    console.error('Error calling waiter:', error);
    return res.status(500).json({ success: false, message: 'Failed to request assistance', error: error.message });
  }
};

export const listPendingWaiterCalls = async (req: Request, res: Response) => {
  try {
    const calls = await prisma.waiterCall.findMany({
      where: { status: 'PENDING' },
      include: {
        table: {
          select: { id: true, tableNumber: true, section: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ success: true, calls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list waiter calls', error: error.message });
  }
};

export const attendWaiterCall = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.waiterCall.update({
      where: { id },
      data: { status: 'ATTENDED' },
    });

    return res.status(200).json({ success: true, message: 'Request marked as attended', call: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update request', error: error.message });
  }
};
