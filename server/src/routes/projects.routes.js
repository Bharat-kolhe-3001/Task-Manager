import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requirePlatformAdmin, requireProjectAdmin, requireProjectMember } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as projectsController from '../controllers/projectsController.js';
import {
  createProjectSchema,
  inviteMemberSchema,
  updateProjectSchema,
} from '../validation/schemas.js';

const router = Router();

router.use(verifyAuth);

router.get('/', asyncHandler(projectsController.listProjects));
router.post('/', requirePlatformAdmin, validate(createProjectSchema), asyncHandler(projectsController.createProject));

router.get('/:id', requireProjectMember('id'), asyncHandler(projectsController.getProject));
router.patch(
  '/:id',
  requireProjectAdmin('id'),
  validate(updateProjectSchema),
  asyncHandler(projectsController.updateProject),
);
router.delete('/:id', requireProjectAdmin('id'), asyncHandler(projectsController.archiveProject));

router.post(
  '/:id/invite',
  requireProjectAdmin('id'),
  validate(inviteMemberSchema),
  asyncHandler(projectsController.inviteMember),
);

router.delete('/:id/members/:userId', requireProjectAdmin('id'), asyncHandler(projectsController.removeMember));

export default router;
