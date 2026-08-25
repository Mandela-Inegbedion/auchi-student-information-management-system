import {
  Gender,
  Prisma,
  PrismaClient,
  Semester,
  StudentStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function requireSecret(name: 'SEED_ADMIN_PASSWORD' | 'SEED_STAFF_PASSWORD'): string {
  const value = process.env[name];

  if (!value || value.length < 12) {
    throw new Error(`${name} must be set and contain at least 12 characters.`);
  }

  return value;
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@auchipoly.edu.ng').toLowerCase();
  const staffEmail = (process.env.SEED_STAFF_EMAIL ?? 'staff@auchipoly.edu.ng').toLowerCase();
  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    hash(requireSecret('SEED_ADMIN_PASSWORD'), 12),
    hash(requireSecret('SEED_STAFF_PASSWORD'), 12),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      fullName: 'System Administrator',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      fullName: 'Academic Staff',
      passwordHash: staffPasswordHash,
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
    create: {
      fullName: 'Academic Staff',
      email: staffEmail,
      passwordHash: staffPasswordHash,
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  const departmentData = [
    {
      code: 'ICT',
      name: 'Information and Communication Technology',
      description: 'Computing, information systems, and communication technology programmes.',
    },
    {
      code: 'ENG',
      name: 'Engineering Technology',
      description: 'Engineering and applied technology programmes.',
    },
    {
      code: 'SCI',
      name: 'Applied Sciences',
      description: 'Applied science and laboratory-based programmes.',
    },
    {
      code: 'BUS',
      name: 'Business Studies',
      description: 'Business, administration, and management programmes.',
    },
  ];

  const departments = new Map<string, { id: string }>();
  for (const department of departmentData) {
    const savedDepartment = await prisma.department.upsert({
      where: { code: department.code },
      update: department,
      create: department,
      select: { id: true },
    });
    departments.set(department.code, savedDepartment);
  }

  const programmeData = [
    { code: 'COMPSCI', name: 'Computer Science', departmentCode: 'ICT' },
    { code: 'STAT', name: 'Statistics', departmentCode: 'SCI' },
    { code: 'EEE', name: 'Electrical/Electronic Engineering Technology', departmentCode: 'ENG' },
    { code: 'MECHE', name: 'Mechanical Engineering Technology', departmentCode: 'ENG' },
    { code: 'BAM', name: 'Business Administration and Management', departmentCode: 'BUS' },
  ];

  const programmes = new Map<string, { id: string }>();
  for (const programme of programmeData) {
    const department = departments.get(programme.departmentCode);
    if (!department) throw new Error(`Missing department ${programme.departmentCode}.`);

    const savedProgramme = await prisma.programme.upsert({
      where: { code: programme.code },
      update: {
        name: programme.name,
        departmentId: department.id,
        description: `${programme.name} programme at Auchi Polytechnic.`,
      },
      create: {
        code: programme.code,
        name: programme.name,
        departmentId: department.id,
        description: `${programme.name} programme at Auchi Polytechnic.`,
      },
      select: { id: true },
    });
    programmes.set(programme.code, savedProgramme);
  }

  const studentData = [
    {
      matricNumber: 'ICT/6252400567',
      firstName: 'Ada',
      middleName: 'Ivie',
      lastName: 'Osagie',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2005-04-12T00:00:00.000Z'),
      email: 'ada.osagie@student.auchipoly.edu.ng',
      phone: '+2348010000001',
      address: 'Auchi, Edo State',
      departmentCode: 'ICT',
      programmeCode: 'COMPSCI',
      admissionYear: 2024,
      status: StudentStatus.ACTIVE,
    },
    {
      matricNumber: 'ENG/6252400568',
      firstName: 'Daniel',
      middleName: null,
      lastName: 'Okoh',
      gender: Gender.MALE,
      dateOfBirth: new Date('2004-08-21T00:00:00.000Z'),
      email: 'daniel.okoh@student.auchipoly.edu.ng',
      phone: '+2348010000002',
      address: 'Jattu, Edo State',
      departmentCode: 'ENG',
      programmeCode: 'EEE',
      admissionYear: 2023,
      status: StudentStatus.ACTIVE,
    },
    {
      matricNumber: 'SCI/6252400569',
      firstName: 'Grace',
      middleName: 'Efe',
      lastName: 'Akpata',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2005-01-30T00:00:00.000Z'),
      email: 'grace.akpata@student.auchipoly.edu.ng',
      phone: '+2348010000003',
      address: 'Benin City, Edo State',
      departmentCode: 'SCI',
      programmeCode: 'STAT',
      admissionYear: 2024,
      status: StudentStatus.ACTIVE,
    },
    {
      matricNumber: 'BUS/6252400570',
      firstName: 'Samuel',
      middleName: 'Ose',
      lastName: 'Eromosele',
      gender: Gender.MALE,
      dateOfBirth: new Date('2003-11-09T00:00:00.000Z'),
      email: 'samuel.eromosele@student.auchipoly.edu.ng',
      phone: '+2348010000004',
      address: 'Ekpoma, Edo State',
      departmentCode: 'BUS',
      programmeCode: 'BAM',
      admissionYear: 2023,
      status: StudentStatus.ACTIVE,
    },
  ];

  const students = new Map<string, { id: string }>();
  for (const student of studentData) {
    const department = departments.get(student.departmentCode);
    const programme = programmes.get(student.programmeCode);
    if (!department || !programme) throw new Error(`Missing relation for ${student.matricNumber}.`);

    const { departmentCode: _departmentCode, programmeCode: _programmeCode, ...studentFields } = student;
    const savedStudent = await prisma.student.upsert({
      where: { matricNumber: student.matricNumber },
      update: { ...studentFields, departmentId: department.id, programmeId: programme.id },
      create: { ...studentFields, departmentId: department.id, programmeId: programme.id },
      select: { id: true },
    });
    students.set(student.matricNumber, savedStudent);
  }

  const academicRecordData = [
    { matricNumber: 'ICT/6252400567', courseCode: 'COM 111', courseTitle: 'Introduction to Computing', creditUnit: 3, score: '78', grade: 'A', gradePoint: '4.00' },
    { matricNumber: 'ICT/6252400567', courseCode: 'MTH 111', courseTitle: 'Logic and Linear Algebra', creditUnit: 2, score: '71', grade: 'A', gradePoint: '4.00' },
    { matricNumber: 'ENG/6252400568', courseCode: 'EEC 213', courseTitle: 'Electrical Circuit Theory', creditUnit: 3, score: '65', grade: 'B', gradePoint: '3.00' },
    { matricNumber: 'ENG/6252400568', courseCode: 'MEC 211', courseTitle: 'Engineering Mechanics', creditUnit: 2, score: '59', grade: 'C', gradePoint: '2.00' },
    { matricNumber: 'SCI/6252400569', courseCode: 'STA 111', courseTitle: 'Descriptive Statistics', creditUnit: 3, score: '74', grade: 'A', gradePoint: '4.00' },
    { matricNumber: 'BUS/6252400570', courseCode: 'BAM 211', courseTitle: 'Principles of Management', creditUnit: 3, score: '68', grade: 'B', gradePoint: '3.00' },
  ];

  for (const record of academicRecordData) {
    const student = students.get(record.matricNumber);
    if (!student) throw new Error(`Missing student ${record.matricNumber}.`);

    const recordFields = {
      studentId: student.id,
      session: '2024/2025',
      semester: Semester.FIRST,
      courseCode: record.courseCode,
      courseTitle: record.courseTitle,
      creditUnit: record.creditUnit,
      score: new Prisma.Decimal(record.score),
      grade: record.grade,
      gradePoint: new Prisma.Decimal(record.gradePoint),
    };

    await prisma.academicRecord.upsert({
      where: {
        student_course_session_semester: {
          studentId: student.id,
          session: recordFields.session,
          semester: recordFields.semester,
          courseCode: recordFields.courseCode,
        },
      },
      update: recordFields,
      create: recordFields,
    });
  }

  const [userCount, departmentCount, programmeCount, studentCount, academicRecordCount] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.programme.count(),
    prisma.student.count(),
    prisma.academicRecord.count(),
  ]);

  console.log('Database seed completed successfully.');
  console.log({ userCount, departmentCount, programmeCount, studentCount, academicRecordCount });
  console.log(`Seeded login emails: ${adminEmail}, ${staffEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
