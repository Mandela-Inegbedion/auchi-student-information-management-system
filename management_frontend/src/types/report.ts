import type { AcademicRecord, Student, StudentStatus } from './student';

export interface ReportDepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface ReportProgrammeOption {
  id: string;
  departmentId: string;
  name: string;
  code: string;
}

export interface ReportSummaryItem {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  percentage: number;
}

export interface ReportStatusItem {
  status: StudentStatus;
  studentCount: number;
  percentage: number;
}

export interface ReportData {
  generatedAt: string;
  filters: {
    departmentId?: string;
    programmeId?: string;
    status?: StudentStatus;
    session?: string;
  };
  options: {
    departments: ReportDepartmentOption[];
    programmes: ReportProgrammeOption[];
    sessions: string[];
  };
  totals: {
    students: number;
    departments: number;
    programmes: number;
    academicRecords: number;
  };
  students: Student[];
  departmentSummary: ReportSummaryItem[];
  programmeSummary: (ReportSummaryItem & { departmentId: string })[];
  statusSummary: ReportStatusItem[];
  academicRecords: AcademicRecord[];
}
