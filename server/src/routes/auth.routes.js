import { Router } from 'express';
import { authRateLimiter } from '../middleware/authRateLimiter.js';
import { verifyAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authController from '../controllers/authController.js';
import { loginSchema, signupSchema } from '../validation/schemas.js';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
router.get('/me', verifyAuth, asyncHandler(authController.me));

export default router;
