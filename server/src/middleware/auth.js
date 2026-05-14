import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: '7d' });
}

export const verifyAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  let payload;
  try {
    payload = jwt.verify(token, getSecret());
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  if (!sub) {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) {
    throw new AppError('User not found', 401, 'USER_NOT_FOUND');
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  next();
});
