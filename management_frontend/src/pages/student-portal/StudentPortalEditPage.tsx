import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, TextArea, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { Student } from '../../types/student';

interface ContactForm {
  email: string;
  phone: string;
  address: string;
}

export function StudentPortalEditPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ContactForm>({ email: '', phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<ContactForm>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ student: Student }>('/student/auth/me')
      .then(({ student }) => {
        if (active) {
          setForm({ email: student.email ?? '', phone: student.phone ?? '', address: student.address ?? '' });
        }
      })
      .catch(() => { if (active) setError('Unable to load your profile.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const errors: Partial<ContactForm> = {};
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.phone && form.phone.trim().length > 30) errors.phone = 'Phone number is too long.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await apiRequest<{ student: Student }>('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      navigate('/student/portal', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save your contact information.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-2xl"><LoadingState label="Loading profile" rows={3} /></Card>;

  return (
    <section className="mx-auto max-w-2xl">
      <Link to="/student/portal" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" /> Back to my profile
      </Link>

      <div className="mt-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Edit contact information</h1>
        <p className="mt-2 text-sm text-slate-600">Update your email address, phone number, and address.</p>
      </div>

      {error && <div className="mt-5"><Alert variant="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="mt-6" noValidate>
        <Card>
          <CardHeader title="Contact details" description="Only contact information can be updated through the portal." />
          <div className="grid gap-5 p-5 sm:p-6">
            <FormField label="Email address" htmlFor="email" error={fieldErrors.email}>
              <TextInput
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
            </FormField>
            <FormField label="Phone number" htmlFor="phone" error={fieldErrors.phone}>
              <TextInput
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+234…"
                disabled={isSubmitting}
              />
            </FormField>
            <FormField label="Address" htmlFor="address" error={fieldErrors.address}>
              <TextArea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                disabled={isSubmitting}
              />
            </FormField>
          </div>
        </Card>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/student/portal" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {!isSubmitting && <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </form>
    </section>
  );
}
