import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { TextInput } from '../../components/ui/FormField';
import { ApiError, apiRequest } from '../../lib/api';
import type { Department } from '../../types/academicUnit';

export function DepartmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState((location.state as { message?: string } | null)?.message ?? '');
  const [selected, setSelected] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if ((location.state as { message?: string } | null)?.message) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function loadDepartments() {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ departments: Department[] }>('/departments');
      setDepartments(data.departments);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load departments.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadDepartments(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) => `${department.name} ${department.code}`.toLowerCase().includes(term));
  }, [departments, search]);

  async function confirmDelete() {
    if (!selected) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiRequest<never>(`/departments/${selected.id}`, { method: 'DELETE' });
      setSuccess(`${selected.name} was deleted successfully.`);
      setSelected(null);
      await loadDepartments();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete department.');
      setSelected(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: TableColumn<Department>[] = [
    { key: 'department', header: 'Department', render: (department) => <div><p className="font-bold text-slate-900">{department.name}</p><p className="mt-1 text-xs text-slate-500">{department.code}</p></div> },
    { key: 'programmes', header: 'Programmes', render: (department) => department._count.programmes },
    { key: 'students', header: 'Students', render: (department) => department._count.students },
    { key: 'description', header: 'Description', render: (department) => <p className="max-w-md truncate text-slate-600">{department.description || 'No description'}</p> },
    {
      key: 'actions', header: 'Actions', className: 'text-right', render: (department) => (
        <div className="flex justify-end gap-1">
          <Link to={`/departments/${department.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" aria-label={`Edit ${department.name}`}><Pencil className="h-4 w-4" /></Link>
          <button type="button" onClick={() => setSelected(department)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${department.name}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Academic structure</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Departments</h1><p className="mt-2 text-sm text-slate-600">Manage the institution’s academic departments.</p></div>
        <Link to="/departments/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4" />Add department</Link>
      </div>
      <div className="mt-6 space-y-4">{success && <Alert variant="success">{success}</Alert>}{error && <Alert variant="error">{error}</Alert>}</div>
      <Card className="mt-6">
        <div className="border-b border-slate-200 p-5 sm:p-6"><div className="relative max-w-md"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments" className="pl-10" /></div></div>
        <CardHeader title={`${filtered.length} department${filtered.length === 1 ? '' : 's'}`} description="Departments with current programme and student dependencies." action={<Building2 className="h-5 w-5 text-emerald-700" />} />
        <DataTable columns={columns} rows={filtered} getRowKey={(department) => department.id} isLoading={isLoading} emptyTitle="No departments found" emptyDescription="Add a department or adjust your search." />
      </Card>
      <ConfirmDialog isOpen={Boolean(selected)} title="Delete department?" description={selected ? `${selected.name} can only be deleted when no programmes or students depend on it.` : ''} confirmLabel="Delete department" isConfirming={isDeleting} onConfirm={() => void confirmDelete()} onClose={() => setSelected(null)} />
    </section>
  );
}
