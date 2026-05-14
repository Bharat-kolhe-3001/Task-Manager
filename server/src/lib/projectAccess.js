import { prisma } from './prisma.js';

/**
 * @param {string} userId
 * @param {string} projectId
 */
export async function getProjectMembership(userId, projectId) {
  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });
}

export async function isPlatformAdmin(userId) {
  const appUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return appUser?.role === 'ADMIN';
}

/**
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function accessibleProjectIds(userId) {
  if (await isPlatformAdmin(userId)) {
    const rows = await prisma.project.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  }
  const rows = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return rows.map((r) => r.projectId);
}

/**
 * @param {string} userId
 * @param {string} projectId
 */
export async function isProjectAdmin(userId, projectId) {
  if (await isPlatformAdmin(userId)) return true;

  const m = await getProjectMembership(userId, projectId);
  return m?.role === 'ADMIN';
}

/**
 * @param {string} userId
 * @param {string} projectId
 */
export async function isProjectMember(userId, projectId) {
  if (await isPlatformAdmin(userId)) return true;

  const m = await getProjectMembership(userId, projectId);
  return !!m;
}
