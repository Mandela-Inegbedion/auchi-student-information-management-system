import { BookOpenCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { SelectInput, TextInput } from '../../components/ui/FormField';
import { ApiError, apiRequest } from '../../lib/api';
import type { AcademicRecord, AcademicRecordStudent, Pagination } from '../../types/student';

export function AcademicRecordsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [students, setStudents] = useState<AcademicRecordStudent[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [session, setSession] = useState('');
  const [semester, setSemester] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState((location.state as { message?: string } | null)?.message ?? '');
  const [selected, setSelected] = useState<AcademicRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if ((location.state as { message?: string } | null)?.message) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    apiRequest<{ students: AcademicRecordStudent[] }>('/academic-records/form-options')
      .then((data) => setStudents(data.students))
      .catch(() => setError('Unable to load student options.'));
  }, []);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const query = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (search) query.set('search', search);
    if (studentId) query.set('studentId', studentId);
    if (session) query.set('session', session);
    if (semester) query.set('semester', semester);
    try {
      const data = await apiRequest<{ records: AcademicRecord[]; pagination: Pagination }>(`/academic-records?${query}`);
      setRecords(data.records);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load academic records.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, semester, session, studentId]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  async function confirmDelete() {
    if (!selected) return;
    setIsDeleting(true);
    try {
      await apiRequest<never>(`/academic-records/${selected.id}`, { method: 'DELETE' });
      setSuccess(`${selected.courseCode} was deleted successfully.`);
      setSelected(null);
      await loadRecords();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete academic record.');
      setSelected(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: TableColumn<AcademicRecord>[] = [
    { key: 'student', header: 'Student', render: (record) => <div><p className="font-bold text-slate-900">{[record.student?.firstName, record.student?.middleName, record.student?.lastName].filter(Boolean).join(' ')}</p><p className="mt-1 text-xs text-slate-500">{record.student?.matricNumber}</p></div> },
    { key: 'course', header: 'Course', render: (record) => <div><p className="font-bold text-slate-900">{record.courseCode}</p><p className="mt-1 max-w-52 truncate text-xs text-slate-500">{record.courseTitle}</p></div> },
    { key: 'period', header: 'Academic period', render: (record) => <div><p>{record.session}</p><p className="mt-1 text-xs capitalize text-slate-500">{record.semester.toLowerCase()}</p></div> },
    { key: 'result', header: 'Result', render: (record) => <div><p className="font-bold text-slate-900">{Number(record.score).toFixed(0)} · {record.grade}</p><p className="mt-1 text-xs text-slate-500">{record.creditUnit} unit(s) · GP {Number(record.gradePoint).toFixed(2)}</p></div> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (record) => <div className="flex justify-end gap-1"><Link to={`/academic-records/${record.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil className="h-4 w-4" /></Link><button type="button" onClick={() => setSelected(record)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div> },
  ];

  return (
    <section className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-700">Academic administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Academic Records</h1><p className="mt-2 text-sm text-slate-600">Manage student courses, scores, grades, and grade points.</p></div><Link to="/academic-records/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4" />Add record</Link></div>
      <div className="mt-6 space-y-4">{success && <Alert variant="success">{success}</Alert>}{error && <Alert variant="error">{error}</Alert>}</div>
      <Card className="mt-6">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.6fr_0.6fr] sm:p-6"><div className="relative"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><TextInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search student or course" className="pl-10" /></div><SelectInput value={studentId} onChange={(event) => { setStudentId(event.target.value); setPage(1); }}><option value="">All students</option>{students.map((student) => <option key={student.id} value={student.id}>{student.matricNumber} — {student.firstName} {student.lastName}</option>)}</SelectInput><TextInput value={session} onChange={(event) => { setSession(event.target.value); setPage(1); }} placeholder="Session" /><SelectInput value={semester} onChange={(event) => { setSemester(event.target.value); setPage(1); }}><option value="">All semesters</option><option value="FIRST">First</option><option value="SECOND">Second</option></SelectInput></div>
        <CardHeader title={`${pagination.total} academic record${pagination.total === 1 ? '' : 's'}`} description="Results stored in the central academic database." action={<BookOpenCheck className="h-5 w-5 text-emerald-700" />} />
        <DataTable columns={columns} rows={records} getRowKey={(record) => record.id} isLoading={isLoading} emptyTitle="No academic records found" emptyDescription="Add a result or adjust the current filters." />
        {!isLoading && pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6"><p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
      </Card>
      <ConfirmDialog isOpen={Boolean(selected)} title="Delete academic record?" description={selected ? `Delete ${selected.courseCode} for ${selected.student?.firstName} ${selected.student?.lastName}? This cannot be undone.` : ''} confirmLabel="Delete record" isConfirming={isDeleting} onConfirm={() => void confirmDelete()} onClose={() => setSelected(null)} />
    </section>
  );
}
