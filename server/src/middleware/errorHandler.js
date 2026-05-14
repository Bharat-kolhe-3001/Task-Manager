import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError.js';

/**
 * @param {import('express').Errback} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ error: message || 'Validation failed', code: 'VALIDATION_ERROR' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with this value already exists', code: 'DUPLICATE' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
    }
    if (err.code === 'P2021' || err.code === 'P2022') {
      return res.status(503).json({
        error: 'Database schema is out of date. From the server folder run: npx prisma db push && npm run db:seed',
        code: 'DB_SCHEMA',
      });
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      error:
        'Could not connect to the database. Set DATABASE_URL in server/.env, then run: npx prisma db push',
      code: 'DB_INIT',
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(err.message);
    return res.status(400).json({ error: 'Invalid query or data', code: 'PRISMA_VALIDATION' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
}
