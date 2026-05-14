import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { isProjectAdmin, isProjectMember } from '../lib/projectAccess.js';

/** Only platform-level User.role ADMIN */
export const requirePlatformAdmin = asyncHandler(async (req, _res, next) => {
  if (req.user.role !== 'ADMIN') {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  next();
});

/**
 * @param {string} paramName — Express route param holding project id (default `id`)
 */
export function requireProjectMember(paramName = 'id') {
  return asyncHandler(async (req, _res, next) => {
    const projectId = req.params[paramName];
    if (!projectId) {
      throw new AppError('Project id missing', 400, 'BAD_REQUEST');
    }
    const allowed = await isProjectMember(req.user.id, projectId);
    if (!allowed) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    next();
  });
}

export function requireProjectAdmin(paramName = 'id') {
  return asyncHandler(async (req, _res, next) => {
    const projectId = req.params[paramName];
    if (!projectId) {
      throw new AppError('Project id missing', 400, 'BAD_REQUEST');
    }
    const allowed = await isProjectAdmin(req.user.id, projectId);
    if (!allowed) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
    next();
  });
}
