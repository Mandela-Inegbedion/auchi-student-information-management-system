import { ArrowLeft, BookOpenCheck, CalendarDays, Mail, MapPin, Pencil, Phone, Trash2, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { AcademicRecord, Student } from '../../types/student';

const dateFormatter = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

const academicColumns: TableColumn<AcademicRecord>[] = [
  { key: 'course', header: 'Course', render: (record) => <div><p className="font-bold text-slate-900">{record.courseCode}</p><p className="mt-1 text-xs text-slate-500">{record.courseTitle}</p></div> },
  { key: 'session', header: 'Session', render: (record) => <div><p>{record.session}</p><p className="mt-1 text-xs capitalize text-slate-500">{record.semester.toLowerCase()} semester</p></div> },
  { key: 'unit', header: 'Unit', render: (record) => record.creditUnit },
  { key: 'score', header: 'Score', render: (record) => Number(record.score).toFixed(0) },
  { key: 'grade', header: 'Grade', render: (record) => <span className="font-bold text-slate-900">{record.grade}</span> },
  { key: 'point', header: 'Point', render: (record) => Number(record.gradePoint).toFixed(2) },
];

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

export function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ student: Student }>(`/students/${id}`);
      setStudent(data.student);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load the student profile.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  async function deleteStudent() {
    if (!id || !student) return;
    setIsDeleting(true);
    try {
      await apiRequest<never>(`/students/${id}`, { method: 'DELETE' });
      navigate('/students', { replace: true, state: { message: 'Student deleted successfully.' } });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete student.');
      setIsDeleteOpen(false);
      setIsDeleting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-6xl"><LoadingState label="Loading student profile" rows={6} /></Card>;

  if (!student) {
    return (
      <section className="mx-auto max-w-3xl">
        <Alert variant="error">{error || 'Student record not found.'}</Alert>
        <Link to="/students" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft className="h-4 w-4" />Back to students</Link>
      </section>
    );
  }

  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');

  return (
    <section className="mx-auto max-w-6xl">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      {error && <div className="mt-5"><Alert variant="error">{error}</Alert></div>}

      <Card className="mt-5 overflow-hidden">
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
            <div className="flex gap-3">
              <Link to={`/students/${student.id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <Button variant="danger" onClick={() => setIsDeleteOpen(true)}><Trash2 className="h-4 w-4" />Delete</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          <div className="flex min-w-0 gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div className="min-w-0"><Detail label="Email" value={student.email} truncate /></div></div>
          <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Phone" value={student.phone} /></div>
          <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Date of birth" value={dateFormatter.format(new Date(student.dateOfBirth))} /></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-emerald-700" /><Detail label="Address" value={student.address} /></div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
          <CardHeader title="Academic placement" description="Current institutional placement." />
          <dl className="grid gap-6 p-6 sm:grid-cols-2">
            <Detail label="Department" value={`${student.department.name} (${student.department.code})`} />
            <Detail label="Programme" value={`${student.programme.name} (${student.programme.code})`} />
            <Detail label="Admission year" value={student.admissionYear} />
            <Detail label="Level" value={student.level} />
            <Detail label="Academic records" value={student.academicRecords?.length ?? 0} />
          </dl>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Academic records" description="Courses and results recorded for this student." action={<Link to={`/academic-records/new?studentId=${student.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><BookOpenCheck className="h-4 w-4 text-emerald-700" />Add record</Link>} />
        <DataTable
          columns={academicColumns}
          rows={student.academicRecords ?? []}
          getRowKey={(record) => record.id}
          emptyTitle="No academic records"
          emptyDescription="Academic results will appear here after they are added in the Academic Records module."
        />
      </Card>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete student record?"
        description={`This will permanently delete ${fullName} and all associated academic records. This action cannot be undone.`}
        confirmLabel="Delete student"
        isConfirming={isDeleting}
        onConfirm={() => void deleteStudent()}
        onClose={() => setIsDeleteOpen(false)}
      />
    </section>
  );
}
