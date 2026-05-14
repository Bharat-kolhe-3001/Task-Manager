import { ZodError } from 'zod';
import { AppError } from '../lib/AppError.js';

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      const raw = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      req.validated = schema.parse(raw);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(new AppError(message || 'Validation failed', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  };
}

/**
 * Merge params + body for PATCH routes that need :id with body
 * @param {import('zod').ZodTypeAny} schema
 */
export function validateParamsAndBody(paramsSchema, bodySchema) {
  return (req, _res, next) => {
    try {
      const params = paramsSchema.parse(req.params);
      const body = bodySchema.parse(req.body);
      req.validated = { ...params, ...body };
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(new AppError(message || 'Validation failed', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  };
}
