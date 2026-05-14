import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().min(1).max(32).optional(),
  members: z.array(z.string()).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    color: z.string().min(1).max(32).optional(),
  })
  .refine((d) => d.name !== undefined || d.description !== undefined || d.color !== undefined, {
    message: 'At least one field is required',
  });

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
  projectId: z.string().min(1),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
  projectId: z.string().min(1).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
});

export const taskListQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined)),
  project: z.string().min(1).optional(),
  assignee: z.string().min(1).optional(),
  overdue: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});
