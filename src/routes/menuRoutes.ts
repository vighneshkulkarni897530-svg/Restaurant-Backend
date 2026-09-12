import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
} from '../controllers/menuController';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../middleware/auth';

const router = Router();

// Public routes for Customer Menu
router.get('/categories', listCategories);
router.get('/items', listMenuItems);
router.get('/items/:id', getMenuItemById);

// Staff/Admin routes for item stock toggling
router.patch('/items/:id/toggle-stock', requireAuth, requireStaffOrAdmin, toggleItemAvailability);

// Admin-only management routes
router.post('/categories', requireAuth, requireAdmin, createCategory);
router.patch('/categories/:id', requireAuth, requireAdmin, updateCategory);
router.delete('/categories/:id', requireAuth, requireAdmin, deleteCategory);

router.post('/items', requireAuth, requireAdmin, createMenuItem);
router.patch('/items/:id', requireAuth, requireAdmin, updateMenuItem);
router.delete('/items/:id', requireAuth, requireAdmin, deleteMenuItem);

export default router;
