import { CalendarDays, Mail, MapPin, Pencil, Phone, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Card, CardHeader } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { Student } from '../../types/student';

const dateFormatter = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

function Detail({ label, value, truncate }: { label: string; value: string | number | null | undefined; truncate?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`mt-2 text-sm font-semibold text-slate-900 ${truncate ? 'truncate' : ''}`} title={truncate && value ? String(value) : undefined}>
        {value || 'Not provided'}
      </dd>
    </div>
  );
}

export function StudentPortalPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ student: Student }>('/student/auth/me');
      setStudent(data.student);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) return <Card className="mx-auto max-w-4xl"><LoadingState label="Loading your profile" rows={5} /></Card>;

  if (!student) {
    return <Alert variant="error">{error || 'Unable to load profile.'}</Alert>;
  }

  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-950 to-emerald-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <UserRound className="h-8 w-8" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{fullName}</h1>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">{student.status}</span>
                </div>
                <p className="mt-2 font-medium text-emerald-100">{student.matricNumber}</p>
              </div>
            </div>
            <Link
              to="/student/portal/edit"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
            >
              <Pencil className="h-4 w-4" /> Edit Contact Info
            </Link>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          <div className="flex min-w-0 gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><Detail label="Email" value={student.email} truncate /></div>
          <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Phone" value={student.phone} /></div>
          <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Date of birth" value={dateFormatter.format(new Date(student.dateOfBirth))} /></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Address" value={student.address} /></div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" description="Official biographical information." />
          <dl className="grid gap-6 p-6 sm:grid-cols-2">
            <Detail label="First name" value={student.firstName} />
            <Detail label="Middle name" value={student.middleName} />
            <Detail label="Last name" value={student.lastName} />
            <Detail label="Gender" value={student.gender.charAt(0) + student.gender.slice(1).toLowerCase()} />
            <Detail label="Matric number" value={student.matricNumber} />
            <Detail label="Status" value={student.status.charAt(0) + student.status.slice(1).toLowerCase()} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Academic placement" description="Your current institutional placement." />
          <dl className="grid gap-6 p-6 sm:grid-cols-2">
            <Detail label="Department" value={`${student.department.name} (${student.department.code})`} />
            <Detail label="Programme" value={`${student.programme.name} (${student.programme.code})`} />
            <Detail label="Level" value={student.level} />
            <Detail label="Admission year" value={student.admissionYear} />
          </dl>
        </Card>
      </div>
    </section>
  );
}
