import { Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, SelectInput, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';

interface Settings {
  institution_name: string;
  current_session: string;
  current_semester: string;
}

const emptySettings: Settings = {
  institution_name: '',
  current_session: '',
  current_semester: '',
};

export function SettingsPage() {
  const [form, setForm] = useState<Settings>(emptySettings);
  const [fieldErrors, setFieldErrors] = useState<Partial<Settings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ settings: Settings }>('/settings')
      .then(({ settings }) => {
        if (active) setForm({ institution_name: settings.institution_name ?? '', current_session: settings.current_session ?? '', current_semester: settings.current_semester ?? '' });
      })
      .catch(() => { if (active) setError('Unable to load settings.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function updateField(field: keyof Settings, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSuccess('');
  }

  function validate() {
    const errors: Partial<Settings> = {};
    if (!form.institution_name.trim()) errors.institution_name = 'Institution name is required.';
    if (!/^\d{4}\/\d{4}$/.test(form.current_session.trim())) errors.current_session = 'Use YYYY/YYYY format (e.g. 2025/2026).';
    if (!form.current_semester) errors.current_semester = 'Select a semester.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await apiRequest<{ settings: Settings }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSuccess('Settings saved successfully.');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save settings.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-2xl"><LoadingState label="Loading settings" rows={3} /></Card>;

  return (
    <section className="mx-auto max-w-2xl">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">System settings</h1>
        <p className="mt-2 text-sm text-slate-600">Configure institution details and the active academic period.</p>
      </div>

      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}
      {success && <div className="mt-6"><Alert variant="success">{success}</Alert></div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <Card>
          <CardHeader title="Institution details" description="General information about the institution." />
          <div className="grid gap-5 p-5 sm:p-6">
            <FormField label="Institution name" htmlFor="institution_name" error={fieldErrors.institution_name}>
              <TextInput
                id="institution_name"
                value={form.institution_name}
                onChange={(e) => updateField('institution_name', e.target.value)}
                disabled={isSubmitting}
              />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardHeader title="Academic period" description="The current active session and semester." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField label="Current session" htmlFor="current_session" hint="Format: YYYY/YYYY (e.g. 2025/2026)" error={fieldErrors.current_session}>
              <TextInput
                id="current_session"
                value={form.current_session}
                onChange={(e) => updateField('current_session', e.target.value)}
                placeholder="2025/2026"
                disabled={isSubmitting}
              />
            </FormField>
            <FormField label="Current semester" htmlFor="current_semester" error={fieldErrors.current_semester}>
              <SelectInput
                id="current_semester"
                value={form.current_semester}
                onChange={(e) => updateField('current_semester', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select semester</option>
                <option value="FIRST">First semester</option>
                <option value="SECOND">Second semester</option>
              </SelectInput>
            </FormField>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            {!isSubmitting && <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </form>
    </section>
  );
}
