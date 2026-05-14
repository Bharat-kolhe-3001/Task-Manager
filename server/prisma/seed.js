import '../src/lib/loadEnv.js';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@orbit.local',
      password: passwordHash,
      name: 'Orbit Admin',
      role: 'ADMIN',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'alex@orbit.local',
      password: passwordHash,
      name: 'Alex Member',
      role: 'MEMBER',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'sam@orbit.local',
      password: passwordHash,
      name: 'Sam Member',
      role: 'MEMBER',
    },
  });

  const projectA = await prisma.project.create({
    data: {
      name: 'Launch Orbit',
      description: 'First release of the Orbit task manager',
      color: '#6366f1',
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'MEMBER' },
          { userId: member2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: 'Marketing Flywheel',
      description: 'Campaigns and content pipeline',
      color: '#ec4899',
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'ADMIN' },
        ],
      },
    },
  });

  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const past = new Date();
  past.setDate(past.getDate() - 2);

  await prisma.task.createMany({
    data: [
      {
        title: 'Define API contracts',
        description: 'OpenAPI-style outline for REST endpoints',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: past,
        completedAt: new Date(),
        projectId: projectA.id,
        assigneeId: member1.id,
        createdById: admin.id,
      },
      {
        title: 'Wire Prisma models',
        description: 'User, project, task relations',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: soon,
        projectId: projectA.id,
        assigneeId: member2.id,
        createdById: member1.id,
      },
      {
        title: 'Dashboard charts',
        description: 'Status breakdown and workload',
        status: 'TODO',
        priority: 'LOW',
        dueDate: null,
        projectId: projectA.id,
        assigneeId: null,
        createdById: admin.id,
      },
      {
        title: 'Blog post calendar',
        description: 'Q2 topics',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: past,
        projectId: projectB.id,
        assigneeId: member1.id,
        createdById: member1.id,
      },
      {
        title: 'Partner outreach',
        description: 'Email 10 partners',
        status: 'IN_REVIEW',
        priority: 'CRITICAL',
        dueDate: soon,
        projectId: projectB.id,
        assigneeId: admin.id,
        createdById: member1.id,
      },
      {
        title: 'Analytics audit',
        description: 'Verify events in staging',
        status: 'DONE',
        priority: 'LOW',
        dueDate: past,
        completedAt: new Date(),
        projectId: projectB.id,
        assigneeId: member1.id,
        createdById: admin.id,
      },
    ],
  });

  console.log('Seed complete:', {
    admin: admin.email,
    members: [member1.email, member2.email],
    projects: [projectA.name, projectB.name],
    tasks: 6,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
