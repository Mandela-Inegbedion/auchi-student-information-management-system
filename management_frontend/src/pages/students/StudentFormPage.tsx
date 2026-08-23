import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, SelectInput, TextArea, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { DepartmentOption, Student, StudentPayload } from '../../types/student';

const emptyForm: StudentPayload = {
  matricNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
  departmentId: '',
  programmeId: '',
  admissionYear: String(new Date().getFullYear()),
  status: 'ACTIVE',
};

type FieldErrors = Partial<Record<keyof StudentPayload, string>>;

export function StudentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentPayload>(emptyForm);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const requests: [Promise<{ departments: DepartmentOption[] }>, Promise<{ student: Student }> | null] = [
      apiRequest<{ departments: DepartmentOption[] }>('/students/form-options'),
      mode === 'edit' && id ? apiRequest<{ student: Student }>(`/students/${id}`) : null,
    ];

    Promise.all([requests[0], requests[1]])
      .then(([options, studentData]) => {
        if (!active) return;
        setDepartments(options.departments);
        if (studentData) {
          const student = studentData.student;
          setForm({
            matricNumber: student.matricNumber,
            firstName: student.firstName,
            middleName: student.middleName ?? '',
            lastName: student.lastName,
            gender: student.gender,
            dateOfBirth: student.dateOfBirth.slice(0, 10),
            email: student.email ?? '',
            phone: student.phone ?? '',
            address: student.address ?? '',
            departmentId: student.departmentId,
            programmeId: student.programmeId,
            admissionYear: String(student.admissionYear),
            status: student.status,
          });
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof ApiError ? requestError.message : 'Unable to load the student form.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, mode]);

  const programmes = useMemo(
    () => departments.find((department) => department.id === form.departmentId)?.programmes ?? [],
    [departments, form.departmentId],
  );

  function updateField<K extends keyof StudentPayload>(field: K, value: StudentPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const errors: FieldErrors = {};
    if (!form.matricNumber.trim()) errors.matricNumber = 'Matric number is required.';
    if (form.firstName.trim().length < 2) errors.firstName = 'Enter the student’s first name.';
    if (form.lastName.trim().length < 2) errors.lastName = 'Enter the student’s last name.';
    if (!form.gender) errors.gender = 'Select a gender.';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.departmentId) errors.departmentId = 'Select a department.';
    if (!form.programmeId) errors.programmeId = 'Select a programme.';
    const year = Number(form.admissionYear);
    if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
      errors.admissionYear = 'Enter a valid admission year.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const endpoint = mode === 'edit' ? `/students/${id}` : '/students';
      await apiRequest<{ student: Student }>(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      navigate('/students', {
        replace: true,
        state: { message: mode === 'edit' ? 'Student updated successfully.' : 'Student registered successfully.' },
      });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save the student record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Card className="mx-auto max-w-5xl"><LoadingState label="Loading student form" rows={6} /></Card>;
  }

  return (
    <section className="mx-auto max-w-5xl">
      <Link to={mode === 'edit' && id ? `/students/${id}` : '/students'} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" /> Back to {mode === 'edit' ? 'student profile' : 'students'}
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-emerald-700">Student administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {mode === 'edit' ? 'Edit student record' : 'Register a student'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">Complete the official personal, contact, and academic placement information.</p>
      </div>

      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <Card>
          <CardHeader title="Personal information" description="Identity and biographical details for the student record." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <FormField label="Matric number" htmlFor="matricNumber" error={fieldErrors.matricNumber}>
              <TextInput id="matricNumber" value={form.matricNumber} onChange={(event) => updateField('matricNumber', event.target.value)} placeholder="AU/ICT/2026/001" disabled={isSubmitting} />
            </FormField>
            <FormField label="First name" htmlFor="firstName" error={fieldErrors.firstName}>
              <TextInput id="firstName" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} disabled={isSubmitting} />
            </FormField>
            <FormField label="Middle name" htmlFor="middleName" error={fieldErrors.middleName}>
              <TextInput id="middleName" value={form.middleName} onChange={(event) => updateField('middleName', event.target.value)} disabled={isSubmitting} />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" error={fieldErrors.lastName}>
              <TextInput id="lastName" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} disabled={isSubmitting} />
            </FormField>
            <FormField label="Gender" htmlFor="gender" error={fieldErrors.gender}>
              <SelectInput id="gender" value={form.gender} onChange={(event) => updateField('gender', event.target.value as StudentPayload['gender'])} disabled={isSubmitting}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </SelectInput>
            </FormField>
            <FormField label="Date of birth" htmlFor="dateOfBirth" error={fieldErrors.dateOfBirth}>
              <TextInput id="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} disabled={isSubmitting} />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardHeader title="Contact information" description="Optional contact details used for official communication." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField label="Email address" htmlFor="email" error={fieldErrors.email}>
              <TextInput id="email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="student@example.com" disabled={isSubmitting} />
            </FormField>
            <FormField label="Phone number" htmlFor="phone" error={fieldErrors.phone}>
              <TextInput id="phone" type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+234…" disabled={isSubmitting} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Address" htmlFor="address" error={fieldErrors.address}>
                <TextArea id="address" rows={3} value={form.address} onChange={(event) => updateField('address', event.target.value)} disabled={isSubmitting} />
              </FormField>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Academic placement" description="Department, programme, admission year, and current status." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField label="Department" htmlFor="departmentId" error={fieldErrors.departmentId}>
              <SelectInput
                id="departmentId"
                value={form.departmentId}
                onChange={(event) => {
                  updateField('departmentId', event.target.value);
                  updateField('programmeId', '');
                }}
                disabled={isSubmitting}
              >
                <option value="">Select department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </SelectInput>
            </FormField>
            <FormField label="Programme" htmlFor="programmeId" error={fieldErrors.programmeId} hint="Programmes are filtered by the selected department.">
              <SelectInput id="programmeId" value={form.programmeId} onChange={(event) => updateField('programmeId', event.target.value)} disabled={isSubmitting || !form.departmentId}>
                <option value="">Select programme</option>
                {programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
              </SelectInput>
            </FormField>
            <FormField label="Admission year" htmlFor="admissionYear" error={fieldErrors.admissionYear}>
              <TextInput id="admissionYear" type="number" min="1950" max={String(new Date().getFullYear() + 1)} value={form.admissionYear} onChange={(event) => updateField('admissionYear', event.target.value)} disabled={isSubmitting} />
            </FormField>
            <FormField label="Status" htmlFor="status" error={fieldErrors.status}>
              <SelectInput id="status" value={form.status} onChange={(event) => updateField('status', event.target.value as StudentPayload['status'])} disabled={isSubmitting}>
                <option value="ACTIVE">Active</option>
                <option value="GRADUATED">Graduated</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </SelectInput>
            </FormField>
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to={mode === 'edit' && id ? `/students/${id}` : '/students'} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
          <Button type="submit" isLoading={isSubmitting}>
            {!isSubmitting && <Save className="h-4 w-4" />}
            {mode === 'edit' ? 'Save changes' : 'Register student'}
          </Button>
        </div>
      </form>
    </section>
  );
}
