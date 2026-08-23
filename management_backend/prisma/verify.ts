import { PrismaClient } from '@prisma/client';
import { getRounds } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [users, departments, programmes, students, academicRecordCount] = await Promise.all([
    prisma.user.findMany({
      select: { email: true, role: true, status: true, passwordHash: true },
    }),
    prisma.department.findMany({
      select: { id: true, _count: { select: { programmes: true, students: true } } },
    }),
    prisma.programme.findMany({ select: { id: true, departmentId: true } }),
    prisma.student.findMany({
      select: {
        id: true,
        departmentId: true,
        programme: { select: { departmentId: true } },
        _count: { select: { academicRecords: true } },
      },
    }),
    prisma.academicRecord.count(),
  ]);

  if (users.length < 2 || !users.every((user) => getRounds(user.passwordHash) >= 12)) {
    throw new Error('Seeded users or password hashes failed verification.');
  }

  if (departments.length < 3 || programmes.length < 3 || students.length < 3 || academicRecordCount < 1) {
    throw new Error('Required sample data is missing.');
  }

  if (!students.every((student) => student.departmentId === student.programme.departmentId)) {
    throw new Error('A seeded student is assigned to a programme in another department.');
  }

  console.log('Database verification passed.');
  console.log({
    users: users.map(({ email, role, status }) => ({ email, role, status })),
    departmentCount: departments.length,
    programmeCount: programmes.length,
    studentCount: students.length,
    academicRecordCount,
    relationshipsValid: true,
    passwordHashesValid: true,
  });
}

main()
  .catch((error: unknown) => {
    console.error('Database verification failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
