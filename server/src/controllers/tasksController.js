import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { accessibleProjectIds, isProjectAdmin, isProjectMember } from '../lib/projectAccess.js';
import { toPublicUser } from '../lib/userPublic.js';

const TASK_STATUS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

/**
 * @param {string[]|undefined} statuses
 */
function normalizeStatuses(statuses) {
  if (!statuses?.length) return undefined;
  const allowed = new Set(TASK_STATUS);
  const filtered = statuses.filter((s) => allowed.has(s));
  return filtered.length ? filtered : undefined;
}

export async function listTasks(req, res) {
  const q = req.validated;
  const projectIds = await accessibleProjectIds(req.user.id);
  if (!projectIds.length) {
    return res.json({ tasks: [] });
  }

  if (q.project && !projectIds.includes(q.project)) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  const projectClause =
    q.project && projectIds.includes(q.project)
      ? { projectId: q.project }
      : { projectId: { in: projectIds } };

  const statusFilter = normalizeStatuses(q.status);
  const where = {
    ...projectClause,
    ...(statusFilter && { status: { in: statusFilter } }),
    ...(q.assignee === 'me' && { assigneeId: req.user.id }),
    ...(q.assignee && q.assignee !== 'me' && { assigneeId: q.assignee }),
    ...(q.overdue === true && {
      dueDate: { lt: new Date() },
      status: { not: 'DONE' },
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: true,
      createdBy: true,
    },
  });

  res.json({
    tasks: tasks.map((t) => ({
      ...t,
      assignee: t.assignee ? toPublicUser(t.assignee) : null,
      createdBy: toPublicUser(t.createdBy),
    })),
  });
}

export async function createTask(req, res) {
  const { title, description, status, priority, dueDate, assigneeId, projectId } = req.validated;

  const canAccess = await isProjectMember(req.user.id, projectId);
  if (!canAccess) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  if (assigneeId) {
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: assigneeId, projectId } },
    });
    if (!assigneeMember) {
      throw new AppError('Assignee must be a member of the project', 400, 'INVALID_ASSIGNEE');
    }
  }

  const completedAt = status === 'DONE' ? new Date() : null;

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      status: status ?? 'TODO',
      priority: priority ?? 'MEDIUM',
      dueDate: dueDate ?? null,
      completedAt,
      assigneeId: assigneeId ?? null,
      projectId,
      createdById: req.user.id,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: true,
      createdBy: true,
    },
  });

  res.status(201).json({
    task: {
      ...task,
      assignee: task.assignee ? toPublicUser(task.assignee) : null,
      createdBy: toPublicUser(task.createdBy),
    },
  });
}

export async function getTask(req, res) {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: true,
      createdBy: true,
    },
  });
  if (!task) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  const canAccess = await isProjectMember(req.user.id, task.projectId);
  if (!canAccess) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  res.json({
    task: {
      ...task,
      assignee: task.assignee ? toPublicUser(task.assignee) : null,
      createdBy: toPublicUser(task.createdBy),
    },
  });
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const body = req.validated;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  const canAccess = await isProjectMember(req.user.id, existing.projectId);
  if (!canAccess) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  if (body.projectId && body.projectId !== existing.projectId) {
    const canMove = await isProjectMember(req.user.id, body.projectId);
    if (!canMove) {
      throw new AppError('Target project not found', 404, 'NOT_FOUND');
    }
  }

  const targetProjectId = body.projectId ?? existing.projectId;
  if (body.assigneeId) {
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: body.assigneeId, projectId: targetProjectId } },
    });
    if (!assigneeMember) {
      throw new AppError('Assignee must be a member of the project', 400, 'INVALID_ASSIGNEE');
    }
  }

  let completedAt = existing.completedAt;
  if (body.status !== undefined) {
    completedAt = body.status === 'DONE' ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      completedAt,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: true,
      createdBy: true,
    },
  });

  res.json({
    task: {
      ...task,
      assignee: task.assignee ? toPublicUser(task.assignee) : null,
      createdBy: toPublicUser(task.createdBy),
    },
  });
}

export async function updateTaskStatus(req, res) {
  const { id } = req.params;
  const { status } = req.validated;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  const canAccess = await isProjectMember(req.user.id, existing.projectId);
  if (!canAccess) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  const completedAt = status === 'DONE' ? new Date() : null;

  const task = await prisma.task.update({
    where: { id },
    data: { status, completedAt },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: true,
      createdBy: true,
    },
  });

  res.json({
    task: {
      ...task,
      assignee: task.assignee ? toPublicUser(task.assignee) : null,
      createdBy: toPublicUser(task.createdBy),
    },
  });
}

export async function deleteTask(req, res) {
  const { id } = req.params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  const allowed = await isProjectAdmin(req.user.id, existing.projectId);
  if (!allowed) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  await prisma.task.delete({ where: { id } });
  res.status(204).send();
}
