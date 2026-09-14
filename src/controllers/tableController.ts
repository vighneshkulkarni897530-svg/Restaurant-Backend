import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

export const getTableByQRToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    const table = await prisma.table.findUnique({
      where: { qrToken: token },
      include: {
        orders: {
          where: {
            status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive table QR code.' });
    }

    if (table.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'This table is currently disabled by hotel management.' });
    }

    // Get hotel details for brand header
    const hotelSetting = await prisma.hotelSetting.findUnique({ where: { id: 'default' } });

    return res.status(200).json({
      success: true,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        section: table.section,
        capacity: table.capacity,
        status: table.status,
        activeOrder: table.orders.length > 0 ? table.orders[0] : null,
      },
      hotel: hotelSetting,
    });
  } catch (error: any) {
    console.error('Error fetching table by QR token:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve table information', error: error.message });
  }
};

export const listTables = async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
      include: {
        orders: {
          where: {
            status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            customerName: true,
            createdAt: true,
          },
        },
        waiterCalls: {
          where: { status: 'PENDING' },
          select: { id: true, requestType: true, createdAt: true },
        },
      },
    });

    return res.status(200).json({ success: true, tables });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list tables', error: error.message });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const { tableNumber, capacity, section, status } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Table number is required' });
    }

    const existing = await prisma.table.findUnique({ where: { tableNumber } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Table ${tableNumber} already exists.` });
    }

    const randomSuffix = uuidv4().slice(0, 8);
    const qrToken = `tbl_palms_${tableNumber.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix}`;

    const table = await prisma.table.create({
      data: {
        tableNumber,
        qrToken,
        capacity: Number(capacity) || 4,
        section: section || 'Main Dining',
        status: status || 'ACTIVE',
      },
    });

    return res.status(201).json({ success: true, message: 'Table created successfully', table });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create table', error: error.message });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, section, status } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(tableNumber && { tableNumber }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(section && { section }),
        ...(status && { status }),
      },
    });

    return res.status(200).json({ success: true, message: 'Table updated successfully', table });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update table', error: error.message });
  }
};

export const regenerateQRToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({ where: { id } });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const randomSuffix = uuidv4().slice(0, 8);
    const newQrToken = `tbl_palms_${table.tableNumber.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix}`;

    const updated = await prisma.table.update({
      where: { id },
      data: { qrToken: newQrToken },
    });

    return res.status(200).json({ success: true, message: 'QR Token regenerated successfully', table: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to regenerate QR token', error: error.message });
  }
};

export const getTableQRCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({ where: { id } });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const frontendUrl = (process.env.CUSTOMER_URL || process.env.FRONTEND_URL || 'https://restaurant-frontend-smoky.vercel.app').replace(/\/$/, '');
    const menuUrl = `${frontendUrl}/menu?table=${table.qrToken}`;

    // Generate high-resolution QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    return res.status(200).json({
      success: true,
      tableNumber: table.tableNumber,
      section: table.section,
      qrToken: table.qrToken,
      menuUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate QR code', error: error.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.table.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Table deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete table', error: error.message });
  }
};
