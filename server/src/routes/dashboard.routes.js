import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.use(verifyAuth);
router.get('/', asyncHandler(dashboardController.getDashboard));

export default router;
