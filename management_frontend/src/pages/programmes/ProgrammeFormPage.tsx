import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, SelectInput, TextArea, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { Department, Programme } from '../../types/academicUnit';

export function ProgrammeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ departmentId: '', name: '', code: '', description: '' });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<{ departmentId?: string; name?: string; code?: string }>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const departmentRequest = apiRequest<{ departments: Department[] }>('/departments');
    const programmeRequest = mode === 'edit' && id ? apiRequest<{ programme: Programme }>(`/programmes/${id}`) : Promise.resolve(null);
    Promise.all([departmentRequest, programmeRequest])
      .then(([departmentData, programmeData]) => {
        setDepartments(departmentData.departments);
        if (programmeData) {
          const programme = programmeData.programme;
          setForm({ departmentId: programme.departmentId, name: programme.name, code: programme.code, description: programme.description ?? '' });
        }
      })
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Unable to load programme form.'))
      .finally(() => setIsLoading(false));
  }, [id, mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.departmentId) nextErrors.departmentId = 'Select a department.';
    if (form.name.trim().length < 2) nextErrors.name = 'Programme name is required.';
    if (!/^[A-Za-z0-9-]{2,30}$/.test(form.code.trim())) nextErrors.code = 'Use 2–30 letters, numbers, or hyphens.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest<{ programme: Programme }>(mode === 'edit' ? `/programmes/${id}` : '/programmes', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      navigate('/programmes', { replace: true, state: { message: `Programme ${mode === 'edit' ? 'updated' : 'created'} successfully.` } });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save programme.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-3xl"><LoadingState rows={5} label="Loading programme" /></Card>;

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/programmes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="h-4 w-4" />Back to programmes</Link>
      <div className="mt-5"><p className="text-sm font-semibold text-emerald-700">Academic structure</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{mode === 'edit' ? 'Edit programme' : 'Add programme'}</h1></div>
      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <Card>
          <CardHeader title="Programme information" description="Assign the programme to its official parent department." />
          <div className="space-y-5 p-5 sm:p-6">
            <FormField label="Department" htmlFor="departmentId" error={errors.departmentId}><SelectInput id="departmentId" value={form.departmentId} onChange={(event) => { setForm({ ...form, departmentId: event.target.value }); setErrors({ ...errors, departmentId: undefined }); }} disabled={isSubmitting}><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</SelectInput></FormField>
            <FormField label="Programme name" htmlFor="name" error={errors.name}><TextInput id="name" value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setErrors({ ...errors, name: undefined }); }} disabled={isSubmitting} /></FormField>
            <FormField label="Programme code" htmlFor="code" error={errors.code} hint="For example: COMPSCI or EEE"><TextInput id="code" value={form.code} onChange={(event) => { setForm({ ...form, code: event.target.value.toUpperCase() }); setErrors({ ...errors, code: undefined }); }} disabled={isSubmitting} /></FormField>
            <FormField label="Description" htmlFor="description"><TextArea id="description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={isSubmitting} /></FormField>
          </div>
        </Card>
        <div className="flex justify-end gap-3"><Link to="/programmes" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><Button type="submit" isLoading={isSubmitting}>{!isSubmitting && <Save className="h-4 w-4" />}{mode === 'edit' ? 'Save changes' : 'Create programme'}</Button></div>
      </form>
    </section>
  );
}
