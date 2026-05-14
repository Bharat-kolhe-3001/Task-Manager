import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as usersController from '../controllers/usersController.js';

const router = Router();

router.use(verifyAuth);
router.get('/', asyncHandler(usersController.listUsers));

export default router;
