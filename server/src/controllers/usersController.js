import { prisma } from '../lib/prisma.js';
import { toPublicUser } from '../lib/userPublic.js';

export async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  res.json({ users: users.map(toPublicUser) });
}
