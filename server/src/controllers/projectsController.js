import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { toPublicUser } from '../lib/userPublic.js';
import { accessibleProjectIds } from '../lib/projectAccess.js';

function serializeMember(m) {
  return {
    userId: m.userId,
    projectId: m.projectId,
    role: m.role,
    user: toPublicUser(m.user),
  };
}

function serializeTask(t) {
  return {
    ...t,
    assignee: t.assignee ? toPublicUser(t.assignee) : null,
    createdBy: toPublicUser(t.createdBy),
  };
}

export async function listProjects(req, res) {
  const ids = await accessibleProjectIds(req.user.id);
  const rows = await prisma.project.findMany({
    where: { id: { in: ids } },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { tasks: true, members: true } },
      members: { include: { user: true } },
      tasks: {
        include: { assignee: true, createdBy: true },
        orderBy: [{ updatedAt: 'desc' }],
      },
    },
  });

  res.json({
    projects: rows.map((p) => ({
      ...p,
      members: p.members.map(serializeMember),
      tasks: p.tasks.map(serializeTask),
    })),
  });
}

export async function createProject(req, res) {
  const { name, description, color, members = [] } = req.validated;

  const memberData = [
    { userId: req.user.id, role: 'ADMIN' },
    ...members
      .filter((id) => id !== req.user.id)
      .map((id) => ({ userId: id, role: 'MEMBER' })),
  ];

  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      color: color ?? '#6366f1',
      createdById: req.user.id,
      members: {
        create: memberData,
      },
    },
    include: {
      _count: { select: { tasks: true, members: true } },
      members: { include: { user: true } },
      tasks: {
        include: { assignee: true, createdBy: true },
        orderBy: [{ updatedAt: 'desc' }],
      },
    },
  });

  res.status(201).json({
    project: {
      ...project,
      members: project.members.map(serializeMember),
      tasks: project.tasks.map(serializeTask),
    },
  });
}

export async function getProject(req, res) {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      tasks: {
        include: { assignee: true, createdBy: true },
        orderBy: [{ updatedAt: 'desc' }],
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  const taskCountsByStatus = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };
  for (const t of project.tasks) {
    taskCountsByStatus[t.status] += 1;
  }

  const { members, tasks, createdById, ...rest } = project;

  res.json({
    project: {
      ...rest,
      ownerId: createdById,
      members: members.map(serializeMember),
      tasks: tasks.map(serializeTask),
      taskCounts: {
        total: tasks.length,
        byStatus: taskCountsByStatus,
      },
    },
  });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const body = req.validated;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color !== undefined && { color: body.color }),
    },
    include: {
      _count: { select: { tasks: true, members: true } },
      members: { include: { user: true } },
      tasks: { include: { assignee: true, createdBy: true }, orderBy: [{ updatedAt: 'desc' }] },
    },
  });

  res.json({
    project: {
      ...project,
      members: project.members.map(serializeMember),
      tasks: project.tasks.map(serializeTask),
    },
  });
}

export async function archiveProject(req, res) {
  const { id } = req.params;

  const project = await prisma.project.update({
    where: { id },
    data: { archived: true },
  });

  res.json({ project });
}

export async function inviteMember(req, res) {
  const { id } = req.params;
  const { email, role } = req.validated;

  const invitee = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!invitee) {
    throw new AppError('No user with that email', 404, 'USER_NOT_FOUND');
  }

  if (invitee.id === req.user.id) {
    throw new AppError('You cannot invite yourself', 400, 'INVALID_TARGET');
  }

  const member = await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: invitee.id, projectId: id } },
    update: { role },
    create: { userId: invitee.id, projectId: id, role },
    include: { user: true },
  });

  res.status(201).json({
    member: {
      userId: member.userId,
      projectId: member.projectId,
      role: member.role,
      user: toPublicUser(member.user),
    },
  });
}

export async function removeMember(req, res) {
  const { id, userId } = req.params;

  const target = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });
  if (!target) {
    throw new AppError('Member not found', 404, 'NOT_FOUND');
  }

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.projectMember.count({
      where: { projectId: id, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new AppError('Cannot remove the last project admin', 400, 'LAST_ADMIN');
    }
  }

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId: id } },
  });

  res.status(204).send();
}
