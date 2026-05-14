import { prisma } from '../lib/prisma.js';
import { accessibleProjectIds } from '../lib/projectAccess.js';
import { toPublicUser } from '../lib/userPublic.js';

export async function getDashboard(req, res) {
  const projectIds = await accessibleProjectIds(req.user.id);

  if (!projectIds.length) {
    return res.json({
      totalTasks: 0,
      tasksByStatus: { FLOATING: 0, IN_MOTION: 0, LANDED: 0 },
      overdueCount: 0,
      projectProgress: [],
      teamWorkload: [],
    });
  }

  const now = new Date();

  const [totalTasks, byStatus, overdueCount, tasksPerProject, workloadRows] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'LANDED' },
      },
    }),
    prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        projectId: { in: projectIds },
        assigneeId: { not: null },
        status: { in: ['FLOATING', 'IN_MOTION'] },
      },
      _count: { _all: true },
    }),
  ]);

  const tasksByStatus = {
    FLOATING: 0,
    IN_MOTION: 0,
    LANDED: 0,
  };
  for (const row of byStatus) {
    tasksByStatus[row.status] = row._count._all;
  }

  const projectMeta = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, color: true },
  });
  const projectMap = new Map(projectMeta.map((p) => [p.id, p]));

  const progressMap = new Map();
  for (const row of tasksPerProject) {
    if (!progressMap.has(row.projectId)) {
      progressMap.set(row.projectId, { total: 0, landed: 0 });
    }
    const entry = progressMap.get(row.projectId);
    entry.total += row._count._all;
    if (row.status === 'LANDED') entry.landed += row._count._all;
  }

  const projectProgress = projectIds.map((pid) => {
    const meta = projectMap.get(pid);
    const agg = progressMap.get(pid) ?? { total: 0, landed: 0 };
    const percent = agg.total === 0 ? 0 : Math.round((agg.landed / agg.total) * 100);
    return {
      projectId: pid,
      name: meta?.name ?? 'Unknown',
      color: meta?.color ?? '#6366f1',
      totalTasks: agg.total,
      landedTasks: agg.landed,
      percentComplete: percent,
    };
  });

  const assigneeIds = workloadRows.map((r) => r.assigneeId).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const teamWorkload = workloadRows
    .filter((r) => r.assigneeId)
    .map((r) => {
      const u = userMap.get(r.assigneeId);
      return {
        userId: r.assigneeId,
        user: u ? toPublicUser(u) : null,
        activeTasks: r._count._all,
      };
    })
    .sort((a, b) => b.activeTasks - a.activeTasks);

  res.json({
    totalTasks,
    tasksByStatus,
    overdueCount,
    projectProgress,
    teamWorkload,
  });
}
