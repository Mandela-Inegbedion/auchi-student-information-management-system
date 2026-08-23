import { Pencil, Plus, Search, School, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { SelectInput, TextInput } from '../../components/ui/FormField';
import { ApiError, apiRequest } from '../../lib/api';
import type { Department, Programme } from '../../types/academicUnit';

export function ProgrammesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState((location.state as { message?: string } | null)?.message ?? '');
  const [selected, setSelected] = useState<Programme | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if ((location.state as { message?: string } | null)?.message) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [programmeData, departmentData] = await Promise.all([
        apiRequest<{ programmes: Programme[] }>('/programmes'),
        apiRequest<{ departments: Department[] }>('/departments'),
      ]);
      setProgrammes(programmeData.programmes);
      setDepartments(departmentData.departments);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load programmes.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return programmes.filter((programme) => {
      const matchesDepartment = !departmentId || programme.departmentId === departmentId;
      const matchesSearch = !term || `${programme.name} ${programme.code} ${programme.department.name}`.toLowerCase().includes(term);
      return matchesDepartment && matchesSearch;
    });
  }, [departmentId, programmes, search]);

  async function confirmDelete() {
    if (!selected) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiRequest<never>(`/programmes/${selected.id}`, { method: 'DELETE' });
      setSuccess(`${selected.name} was deleted successfully.`);
      setSelected(null);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete programme.');
      setSelected(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: TableColumn<Programme>[] = [
    { key: 'programme', header: 'Programme', render: (programme) => <div><p className="font-bold text-slate-900">{programme.name}</p><p className="mt-1 text-xs text-slate-500">{programme.code}</p></div> },
    { key: 'department', header: 'Department', render: (programme) => <div><p className="font-medium text-slate-800">{programme.department.name}</p><p className="mt-1 text-xs text-slate-500">{programme.department.code}</p></div> },
    { key: 'students', header: 'Students', render: (programme) => programme._count.students },
    { key: 'description', header: 'Description', render: (programme) => <p className="max-w-sm truncate text-slate-600">{programme.description || 'No description'}</p> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (programme) => <div className="flex justify-end gap-1"><Link to={`/programmes/${programme.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil className="h-4 w-4" /></Link><button type="button" onClick={() => setSelected(programme)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div> },
  ];

  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-700">Academic structure</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Programmes</h1><p className="mt-2 text-sm text-slate-600">Manage programmes and their parent departments.</p></div><Link to="/programmes/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4" />Add programme</Link></div>
      <div className="mt-6 space-y-4">{success && <Alert variant="success">{success}</Alert>}{error && <Alert variant="error">{error}</Alert>}</div>
      <Card className="mt-6">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-[minmax(260px,1fr)_minmax(220px,0.6fr)] sm:p-6"><div className="relative"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search programmes" className="pl-10" /></div><SelectInput value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</SelectInput></div>
        <CardHeader title={`${filtered.length} programme${filtered.length === 1 ? '' : 's'}`} description="Programmes with their current student dependencies." action={<School className="h-5 w-5 text-emerald-700" />} />
        <DataTable columns={columns} rows={filtered} getRowKey={(programme) => programme.id} isLoading={isLoading} emptyTitle="No programmes found" emptyDescription="Add a programme or adjust your filters." />
      </Card>
      <ConfirmDialog isOpen={Boolean(selected)} title="Delete programme?" description={selected ? `${selected.name} can only be deleted when no student records depend on it.` : ''} confirmLabel="Delete programme" isConfirming={isDeleting} onConfirm={() => void confirmDelete()} onClose={() => setSelected(null)} />
    </section>
  );
}
