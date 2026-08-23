import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, TextArea, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { Department } from '../../types/academicUnit';

export function DepartmentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    apiRequest<{ department: Department }>(`/departments/${id}`)
      .then(({ department }) => setForm({ name: department.name, code: department.code, description: department.description ?? '' }))
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Unable to load department.'))
      .finally(() => setIsLoading(false));
  }, [id, mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Department name is required.';
    if (!/^[A-Za-z0-9-]{2,20}$/.test(form.code.trim())) nextErrors.code = 'Use 2–20 letters, numbers, or hyphens.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest<{ department: Department }>(mode === 'edit' ? `/departments/${id}` : '/departments', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      navigate('/departments', { replace: true, state: { message: `Department ${mode === 'edit' ? 'updated' : 'created'} successfully.` } });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save department.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-3xl"><LoadingState rows={4} label="Loading department" /></Card>;

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/departments" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="h-4 w-4" />Back to departments</Link>
      <div className="mt-5"><p className="text-sm font-semibold text-emerald-700">Academic structure</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{mode === 'edit' ? 'Edit department' : 'Add department'}</h1></div>
      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <Card>
          <CardHeader title="Department information" description="Use the official institutional name and short code." />
          <div className="space-y-5 p-5 sm:p-6">
            <FormField label="Department name" htmlFor="name" error={errors.name}><TextInput id="name" value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setErrors({ ...errors, name: undefined }); }} disabled={isSubmitting} /></FormField>
            <FormField label="Department code" htmlFor="code" error={errors.code} hint="For example: ICT or ENG"><TextInput id="code" value={form.code} onChange={(event) => { setForm({ ...form, code: event.target.value.toUpperCase() }); setErrors({ ...errors, code: undefined }); }} disabled={isSubmitting} /></FormField>
            <FormField label="Description" htmlFor="description"><TextArea id="description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={isSubmitting} /></FormField>
          </div>
        </Card>
        <div className="flex justify-end gap-3"><Link to="/departments" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><Button type="submit" isLoading={isSubmitting}>{!isSubmitting && <Save className="h-4 w-4" />}{mode === 'edit' ? 'Save changes' : 'Create department'}</Button></div>
      </form>
    </section>
  );
}
