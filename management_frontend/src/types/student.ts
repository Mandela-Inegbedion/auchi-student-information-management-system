export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'WITHDRAWN';
export type Semester = 'FIRST' | 'SECOND';

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  programmes: ProgrammeOption[];
}

export interface ProgrammeOption {
  id: string;
  name: string;
  code: string;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  session: string;
  semester: Semester;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  score: string;
  grade: string;
  gradePoint: string;
  createdAt: string;
  updatedAt: string;
  student?: AcademicRecordStudent;
}

export interface AcademicRecordStudent {
  id: string;
  matricNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status?: StudentStatus;
  department?: { id: string; name: string; code: string };
  programme?: { id: string; name: string; code: string };
}

export interface AcademicRecordPayload {
  studentId: string;
  session: string;
  semester: Semester | '';
  courseCode: string;
  courseTitle: string;
  creditUnit: string;
  score: string;
  grade: string;
  gradePoint: string;
}

export interface Student {
  id: string;
  matricNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  departmentId: string;
  programmeId: string;
  admissionYear: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; code: string };
  programme: { id: string; name: string; code: string };
  academicRecords?: AcademicRecord[];
  _count?: { academicRecords: number };
}

export interface StudentPayload {
  matricNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: Gender | '';
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  departmentId: string;
  programmeId: string;
  admissionYear: string;
  status: StudentStatus;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
