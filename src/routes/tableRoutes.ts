import { Router } from 'express';
import {
  getTableByQRToken,
  listTables,
  createTable,
  updateTable,
  regenerateQRToken,
  getTableQRCode,
  deleteTable,
} from '../controllers/tableController';
import { requireAuth, requireStaffOrAdmin, requireAdmin } from '../middleware/auth';

const router = Router();

// Public route for Customer QR Scan
router.get('/qr/:token', getTableByQRToken);

// Protected routes for Staff & Admin
router.get('/', requireAuth, requireStaffOrAdmin, listTables);
router.get('/:id/qr-code', requireAuth, requireStaffOrAdmin, getTableQRCode);
router.post('/', requireAuth, requireAdmin, createTable);
router.patch('/:id', requireAuth, requireAdmin, updateTable);
router.post('/:id/regenerate-qr', requireAuth, requireAdmin, regenerateQRToken);
router.delete('/:id', requireAuth, requireAdmin, deleteTable);

export default router;
