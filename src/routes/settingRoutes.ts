import { Router } from 'express';
import { getHotelSettings, updateHotelSettings } from '../controllers/settingController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public route so customers can see restaurant name, tax rate, wifi info
router.get('/', getHotelSettings);

// Admin route to update settings
router.put('/', requireAuth, requireAdmin, updateHotelSettings);

export default router;
