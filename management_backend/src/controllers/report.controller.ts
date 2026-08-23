import { StudentStatus, type Prisma } from '@prisma/client';
import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';
import { reportQuerySchema } from '../validation/report.validation.js';

export const getReports: RequestHandler = async (request, response) => {
  const validation = reportQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ success: false, message: validation.error.issues[0]?.message ?? 'Invalid report filters.' });
    return;
  }

  const { departmentId, programmeId, status, session } = validation.data;
  const studentWhere: Prisma.StudentWhereInput = { departmentId, programmeId, status };

  try {
    const [students, academicRecords, departments, programmes, sessionRows] = await prisma.$transaction([
      prisma.student.findMany({
        where: studentWhere,
        orderBy: [{ matricNumber: 'asc' }],
        include: {
          department: { select: { id: true, name: true, code: true } },
          programme: { select: { id: true, name: true, code: true } },
          _count: { select: { academicRecords: true } },
        },
      }),
      prisma.academicRecord.findMany({
        where: { session, student: studentWhere },
        orderBy: [{ session: 'desc' }, { semester: 'asc' }, { courseCode: 'asc' }],
        include: {
          student: {
            select: {
              id: true,
              matricNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              status: true,
              department: { select: { id: true, name: true, code: true } },
              programme: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } }),
      prisma.programme.findMany({ orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }], select: { id: true, departmentId: true, name: true, code: true } }),
      prisma.academicRecord.findMany({ distinct: ['session'], orderBy: { session: 'desc' }, select: { session: true } }),
    ]);

    const departmentCounts = new Map<string, number>();
    const programmeCounts = new Map<string, number>();
    const statusCounts = new Map<StudentStatus, number>();
    for (const student of students) {
      departmentCounts.set(student.departmentId, (departmentCounts.get(student.departmentId) ?? 0) + 1);
      programmeCounts.set(student.programmeId, (programmeCounts.get(student.programmeId) ?? 0) + 1);
      statusCounts.set(student.status, (statusCounts.get(student.status) ?? 0) + 1);
    }

    const percentage = (count: number) => students.length === 0 ? 0 : Number(((count / students.length) * 100).toFixed(1));
    const departmentSummary = departments
      .filter((department) => !departmentId || department.id === departmentId)
      .map((department) => ({ ...department, studentCount: departmentCounts.get(department.id) ?? 0, percentage: percentage(departmentCounts.get(department.id) ?? 0) }));
    const programmeSummary = programmes
      .filter((programme) => (!departmentId || programme.departmentId === departmentId) && (!programmeId || programme.id === programmeId))
      .map((programme) => ({ ...programme, studentCount: programmeCounts.get(programme.id) ?? 0, percentage: percentage(programmeCounts.get(programme.id) ?? 0) }));
    const statusSummary = Object.values(StudentStatus).map((studentStatus) => ({
      status: studentStatus,
      studentCount: statusCounts.get(studentStatus) ?? 0,
      percentage: percentage(statusCounts.get(studentStatus) ?? 0),
    }));

    response.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        filters: validation.data,
        options: { departments, programmes, sessions: sessionRows.map((row) => row.session) },
        totals: {
          students: students.length,
          departments: departmentSummary.filter((item) => item.studentCount > 0).length,
          programmes: programmeSummary.filter((item) => item.studentCount > 0).length,
          academicRecords: academicRecords.length,
        },
        students,
        departmentSummary,
        programmeSummary,
        statusSummary,
        academicRecords,
      },
    });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to generate reports.' });
  }
};
