import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as tasksController from '../controllers/tasksController.js';
import {
  createTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validation/schemas.js';

const router = Router();

router.use(verifyAuth);

router.get('/', validate(taskListQuerySchema, 'query'), asyncHandler(tasksController.listTasks));
router.post('/', validate(createTaskSchema), asyncHandler(tasksController.createTask));

router.get('/:id', asyncHandler(tasksController.getTask));
router.patch('/:id/status', validate(updateTaskStatusSchema), asyncHandler(tasksController.updateTaskStatus));
router.patch('/:id', validate(updateTaskSchema), asyncHandler(tasksController.updateTask));
router.delete('/:id', asyncHandler(tasksController.deleteTask));

export default router;
