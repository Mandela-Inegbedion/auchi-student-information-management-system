import { BookOpenCheck, Building2, FileBarChart2, PieChart, Printer, RotateCcw, School, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { SelectInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { AcademicRecord, Student, StudentStatus } from '../../types/student';
import type { ReportData, ReportStatusItem, ReportSummaryItem } from '../../types/report';

type ReportView = 'students' | 'departments' | 'programmes' | 'status' | 'academic';

const reportTabs: { id: ReportView; label: string; icon: typeof Users }[] = [
  { id: 'students', label: 'Student list', icon: Users },
  { id: 'departments', label: 'By department', icon: Building2 },
  { id: 'programmes', label: 'By programme', icon: School },
  { id: 'status', label: 'Status summary', icon: PieChart },
  { id: 'academic', label: 'Academic records', icon: BookOpenCheck },
];

const initialFilters = { departmentId: '', programmeId: '', status: '', session: '' };

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-800',
    GRADUATED: 'bg-blue-50 text-blue-800',
    SUSPENDED: 'bg-amber-50 text-amber-800',
    WITHDRAWN: 'bg-slate-100 text-slate-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] ?? styles.WITHDRAWN}`}>{status}</span>;
}

export function ReportsPage() {
  const [activeView, setActiveView] = useState<ReportView>('students');
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const query = new URLSearchParams();
    if (filters.departmentId) query.set('departmentId', filters.departmentId);
    if (filters.programmeId) query.set('programmeId', filters.programmeId);
    if (filters.status) query.set('status', filters.status);
    if (filters.session) query.set('session', filters.session);
    try {
      setData(await apiRequest<ReportData>(`/reports?${query}`));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to generate reports.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const programmes = useMemo(() => data?.options.programmes.filter((programme) => !filters.departmentId || programme.departmentId === filters.departmentId) ?? [], [data?.options.programmes, filters.departmentId]);
  const activeTitle = reportTabs.find((tab) => tab.id === activeView)?.label ?? 'Report';
  const selectedDepartment = data?.options.departments.find((item) => item.id === filters.departmentId)?.name;
  const selectedProgramme = data?.options.programmes.find((item) => item.id === filters.programmeId)?.name;
  const filterDescription = [selectedDepartment, selectedProgramme, filters.status && `${filters.status} students`, filters.session && `Session ${filters.session}`].filter(Boolean).join(' · ') || 'All institutional records';

  const studentColumns: TableColumn<Student>[] = [
    { key: 'matric', header: 'Matric number', render: (student) => <span className="font-bold text-slate-900">{student.matricNumber}</span> },
    { key: 'name', header: 'Student', render: (student) => [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') },
    { key: 'department', header: 'Department', render: (student) => student.department.name },
    { key: 'programme', header: 'Programme', render: (student) => student.programme.name },
    { key: 'year', header: 'Admission', render: (student) => student.admissionYear },
    { key: 'status', header: 'Status', render: (student) => statusBadge(student.status) },
  ];

  const summaryColumns: TableColumn<ReportSummaryItem>[] = [
    { key: 'code', header: 'Code', render: (item) => <span className="font-bold text-slate-900">{item.code}</span> },
    { key: 'name', header: 'Name', render: (item) => item.name },
    { key: 'students', header: 'Students', render: (item) => item.studentCount },
    { key: 'share', header: 'Share', render: (item) => `${item.percentage.toFixed(1)}%` },
  ];

  const statusColumns: TableColumn<ReportStatusItem>[] = [
    { key: 'status', header: 'Student status', render: (item) => statusBadge(item.status) },
    { key: 'students', header: 'Students', render: (item) => item.studentCount },
    { key: 'share', header: 'Share', render: (item) => `${item.percentage.toFixed(1)}%` },
  ];

  const academicColumns: TableColumn<AcademicRecord>[] = [
    { key: 'student', header: 'Student', render: (record) => <div><p className="font-bold text-slate-900">{record.student?.matricNumber}</p><p className="mt-1 text-xs text-slate-500">{[record.student?.firstName, record.student?.middleName, record.student?.lastName].filter(Boolean).join(' ')}</p></div> },
    { key: 'course', header: 'Course', render: (record) => <div><p className="font-bold text-slate-900">{record.courseCode}</p><p className="mt-1 text-xs text-slate-500">{record.courseTitle}</p></div> },
    { key: 'period', header: 'Period', render: (record) => <div><p>{record.session}</p><p className="mt-1 text-xs capitalize text-slate-500">{record.semester.toLowerCase()}</p></div> },
    { key: 'credit', header: 'Credit', render: (record) => record.creditUnit },
    { key: 'score', header: 'Score', render: (record) => Number(record.score).toFixed(0) },
    { key: 'grade', header: 'Grade', render: (record) => <span className="font-bold text-slate-900">{record.grade}</span> },
    { key: 'point', header: 'Grade point', render: (record) => Number(record.gradePoint).toFixed(2) },
  ];

  function reportTable() {
    if (!data) return isLoading ? <LoadingState label="Generating report" rows={6} /> : null;
    if (activeView === 'students') return <DataTable columns={studentColumns} rows={data.students} getRowKey={(student) => student.id} isLoading={isLoading} emptyTitle="No students found" emptyDescription="No students match the selected filters." />;
    if (activeView === 'departments') return <DataTable columns={summaryColumns} rows={data.departmentSummary} getRowKey={(item) => item.id} isLoading={isLoading} emptyTitle="No departments found" emptyDescription="No departments match the selected filters." />;
    if (activeView === 'programmes') return <DataTable columns={summaryColumns} rows={data.programmeSummary} getRowKey={(item) => item.id} isLoading={isLoading} emptyTitle="No programmes found" emptyDescription="No programmes match the selected filters." />;
    if (activeView === 'status') return <DataTable columns={statusColumns} rows={data.statusSummary} getRowKey={(item) => item.status} isLoading={isLoading} emptyTitle="No status data" emptyDescription="No students match the selected filters." />;
    return <DataTable columns={academicColumns} rows={data.academicRecords} getRowKey={(record) => record.id} isLoading={isLoading} emptyTitle="No academic records found" emptyDescription="No academic records match the selected filters." />;
  }

  return (
    <section className="mx-auto max-w-[1500px] report-page">
      <div className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Institutional information</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Reports</h1><p className="mt-2 text-sm text-slate-600">Generate printable reports from current database records.</p></div>
        <Button type="button" variant="secondary" onClick={() => window.print()} disabled={!data || isLoading}><Printer className="h-4 w-4" />Print report</Button>
      </div>

      {error && <div className="print-hidden mt-6"><Alert variant="error">{error}</Alert></div>}

      <Card className="print-hidden mt-6">
        <CardHeader title="Report filters" description="The academic-session filter applies to Academic Records; other filters apply across all reports." action={<FileBarChart2 className="h-5 w-5 text-emerald-700" />} />
        <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] sm:p-6">
          <SelectInput value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value, programmeId: '' })}><option value="">All departments</option>{data?.options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</SelectInput>
          <SelectInput value={filters.programmeId} onChange={(event) => setFilters({ ...filters, programmeId: event.target.value })}><option value="">All programmes</option>{programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</SelectInput>
          <SelectInput value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{(['ACTIVE', 'GRADUATED', 'SUSPENDED', 'WITHDRAWN'] as StudentStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput>
          <SelectInput value={filters.session} onChange={(event) => setFilters({ ...filters, session: event.target.value })}><option value="">All sessions</option>{data?.options.sessions.map((session) => <option key={session} value={session}>{session}</option>)}</SelectInput>
          <Button type="button" variant="ghost" onClick={() => setFilters(initialFilters)} disabled={!Object.values(filters).some(Boolean)}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </Card>

      <div className="print-hidden mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Students</p><p className="mt-2 text-3xl font-bold text-slate-950">{data?.totals.students ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Departments represented</p><p className="mt-2 text-3xl font-bold text-slate-950">{data?.totals.departments ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Programmes represented</p><p className="mt-2 text-3xl font-bold text-slate-950">{data?.totals.programmes ?? 0}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Academic records</p><p className="mt-2 text-3xl font-bold text-slate-950">{data?.totals.academicRecords ?? 0}</p></Card>
      </div>

      <div className="print-hidden mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Report type">
        {reportTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeView === tab.id} onClick={() => setActiveView(tab.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeView === tab.id ? 'bg-emerald-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}><tab.icon className="h-4 w-4" />{tab.label}</button>)}
      </div>

      <div className="print-only report-heading">
        <p>Auchi Polytechnic</p><h1>Student Information Management System</h1><h2>{activeTitle}</h2><p>{filterDescription}</p><p>Generated {data ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.generatedAt)) : ''}</p>
      </div>

      <Card className="report-surface mt-6">
        <CardHeader title={activeTitle} description={`${filterDescription}${data ? ` · Generated ${new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))}` : ''}`} />
        {reportTable()}
      </Card>
    </section>
  );
}
