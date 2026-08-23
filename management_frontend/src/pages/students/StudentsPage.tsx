import { Eye, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { SelectInput, TextInput } from '../../components/ui/FormField';
import { ApiError, apiRequest } from '../../lib/api';
import type { DepartmentOption, Pagination, Student, StudentStatus } from '../../types/student';

const statusStyles: Record<StudentStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800',
  GRADUATED: 'bg-blue-50 text-blue-800',
  SUSPENDED: 'bg-amber-50 text-amber-800',
  WITHDRAWN: 'bg-slate-100 text-slate-700',
};

interface LocationState {
  message?: string;
}

export function StudentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState((location.state as LocationState | null)?.message ?? '');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if ((location.state as LocationState | null)?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    apiRequest<{ departments: DepartmentOption[] }>('/students/form-options')
      .then((data) => setDepartments(data.departments))
      .catch(() => setError('Unable to load department and programme filters.'));
  }, []);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const query = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (search) query.set('search', search);
    if (departmentId) query.set('departmentId', departmentId);
    if (programmeId) query.set('programmeId', programmeId);
    if (status) query.set('status', status);

    try {
      const data = await apiRequest<{ students: Student[]; pagination: Pagination }>(`/students?${query}`);
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load students.');
    } finally {
      setIsLoading(false);
    }
  }, [departmentId, page, programmeId, search, status]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const programmes = useMemo(
    () => departments.find((department) => department.id === departmentId)?.programmes ?? [],
    [departmentId, departments],
  );

  function changeDepartment(value: string) {
    setDepartmentId(value);
    setProgrammeId('');
    setPage(1);
  }

  async function confirmDelete() {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiRequest<never>(`/students/${studentToDelete.id}`, { method: 'DELETE' });
      setSuccess(`${studentToDelete.firstName} ${studentToDelete.lastName} was deleted successfully.`);
      setStudentToDelete(null);
      await loadStudents();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete student.');
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: TableColumn<Student>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (student) => (
        <div>
          <Link to={`/students/${student.id}`} className="font-bold text-slate-900 hover:text-emerald-800">
            {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}
          </Link>
          <p className="mt-1 text-xs font-medium text-slate-500">{student.matricNumber}</p>
        </div>
      ),
    },
    {
      key: 'academicUnit',
      header: 'Academic unit',
      render: (student) => (
        <div>
          <p className="font-medium text-slate-800">{student.department.code}</p>
          <p className="mt-1 max-w-52 truncate text-xs text-slate-500">{student.programme.name}</p>
        </div>
      ),
    },
    { key: 'year', header: 'Admission', render: (student) => student.admissionYear },
    {
      key: 'status',
      header: 'Status',
      render: (student) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[student.status]}`}>
          {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (student) => (
        <div className="flex justify-end gap-1">
          <Link to={`/students/${student.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-800" aria-label={`View ${student.firstName}`}>
            <Eye className="h-4 w-4" />
          </Link>
          <Link to={`/students/${student.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" aria-label={`Edit ${student.firstName}`}>
            <Pencil className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => setStudentToDelete(student)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${student.firstName}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-[1500px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Student administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Students</h1>
          <p className="mt-2 text-sm text-slate-600">Search, register, review, and maintain student records.</p>
        </div>
        <Link to="/students/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
          <Plus className="h-4 w-4" /> Register student
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_1fr_1fr_0.8fr] sm:p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <TextInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or matric number" className="pl-10" aria-label="Search students" />
          </div>
          <SelectInput value={departmentId} onChange={(event) => changeDepartment(event.target.value)} aria-label="Filter by department">
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </SelectInput>
          <SelectInput value={programmeId} onChange={(event) => { setProgrammeId(event.target.value); setPage(1); }} disabled={!departmentId} aria-label="Filter by programme">
            <option value="">All programmes</option>
            {programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
          </SelectInput>
          <SelectInput value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </SelectInput>
        </div>
        <CardHeader
          title={`${pagination.total.toLocaleString()} student${pagination.total === 1 ? '' : 's'}`}
          description="Results are sourced from the central student database."
        />
        <DataTable
          columns={columns}
          rows={students}
          getRowKey={(student) => student.id}
          isLoading={isLoading}
          emptyTitle="No students found"
          emptyDescription="Adjust the filters or register a new student record."
        />
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(studentToDelete)}
        title="Delete student record?"
        description={studentToDelete ? `This will permanently delete ${studentToDelete.firstName} ${studentToDelete.lastName} and associated academic records. This action cannot be undone.` : ''}
        confirmLabel="Delete student"
        isConfirming={isDeleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setStudentToDelete(null)}
      />
    </section>
  );
}
