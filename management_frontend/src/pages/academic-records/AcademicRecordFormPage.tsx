import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { FormField, SelectInput, TextInput } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { AcademicRecord, AcademicRecordPayload, AcademicRecordStudent } from '../../types/student';

type Errors = Partial<Record<keyof AcademicRecordPayload, string>>;

export function AcademicRecordFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<AcademicRecordStudent[]>([]);
  const [form, setForm] = useState<AcademicRecordPayload>({ studentId: searchParams.get('studentId') ?? '', session: '', semester: '', courseCode: '', courseTitle: '', creditUnit: '', score: '', grade: '', gradePoint: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const optionRequest = apiRequest<{ students: AcademicRecordStudent[] }>('/academic-records/form-options');
    const recordRequest = mode === 'edit' && id ? apiRequest<{ record: AcademicRecord }>(`/academic-records/${id}`) : Promise.resolve(null);
    Promise.all([optionRequest, recordRequest])
      .then(([optionData, recordData]) => {
        setStudents(optionData.students);
        if (recordData) {
          const record = recordData.record;
          setForm({ studentId: record.studentId, session: record.session, semester: record.semester, courseCode: record.courseCode, courseTitle: record.courseTitle, creditUnit: String(record.creditUnit), score: String(record.score), grade: record.grade, gradePoint: String(record.gradePoint) });
        }
      })
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Unable to load academic record form.'))
      .finally(() => setIsLoading(false));
  }, [id, mode]);

  function update<K extends keyof AcademicRecordPayload>(field: K, value: AcademicRecordPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!form.studentId) next.studentId = 'Select a student.';
    if (!/^\d{4}\/\d{4}$/.test(form.session)) next.session = 'Use YYYY/YYYY format.';
    else { const [start, end] = form.session.split('/').map(Number); if (end !== start + 1) next.session = 'Session years must be consecutive.'; }
    if (!form.semester) next.semester = 'Select a semester.';
    if (form.courseCode.trim().length < 2) next.courseCode = 'Course code is required.';
    if (form.courseTitle.trim().length < 2) next.courseTitle = 'Course title is required.';
    const credit = Number(form.creditUnit); if (!Number.isInteger(credit) || credit < 1 || credit > 6) next.creditUnit = 'Credit unit must be between 1 and 6.';
    const score = Number(form.score); if (form.score === '' || score < 0 || score > 100) next.score = 'Score must be between 0 and 100.';
    if (!form.grade.trim()) next.grade = 'Grade is required.';
    const point = Number(form.gradePoint); if (form.gradePoint === '' || point < 0 || point > 5) next.gradePoint = 'Grade point must be between 0 and 5.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest<{ record: AcademicRecord }>(mode === 'edit' ? `/academic-records/${id}` : '/academic-records', { method: mode === 'edit' ? 'PUT' : 'POST', body: JSON.stringify(form) });
      navigate('/academic-records', { replace: true, state: { message: `Academic record ${mode === 'edit' ? 'updated' : 'created'} successfully.` } });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save academic record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Card className="mx-auto max-w-4xl"><LoadingState rows={6} label="Loading academic record" /></Card>;

  return (
    <section className="mx-auto max-w-4xl">
      <Link to="/academic-records" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="h-4 w-4" />Back to academic records</Link>
      <div className="mt-5"><p className="text-sm font-semibold text-emerald-700">Academic administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{mode === 'edit' ? 'Edit academic record' : 'Add academic record'}</h1><p className="mt-2 text-sm text-slate-600">Record a student’s course result for an academic session and semester.</p></div>
      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
        <Card>
          <CardHeader title="Student and academic period" description="Select the student, session, and semester for this result." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2"><FormField label="Student" htmlFor="studentId" error={errors.studentId}><SelectInput id="studentId" value={form.studentId} onChange={(event) => update('studentId', event.target.value)} disabled={isSubmitting}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.matricNumber} — {student.firstName} {student.lastName}</option>)}</SelectInput></FormField></div>
            <FormField label="Academic session" htmlFor="session" error={errors.session} hint="For example: 2025/2026"><TextInput id="session" value={form.session} onChange={(event) => update('session', event.target.value)} placeholder="2025/2026" disabled={isSubmitting} /></FormField>
            <FormField label="Semester" htmlFor="semester" error={errors.semester}><SelectInput id="semester" value={form.semester} onChange={(event) => update('semester', event.target.value as AcademicRecordPayload['semester'])} disabled={isSubmitting}><option value="">Select semester</option><option value="FIRST">First semester</option><option value="SECOND">Second semester</option></SelectInput></FormField>
          </div>
        </Card>
        <Card>
          <CardHeader title="Course and result" description="Enter the official course details and assessed result." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <FormField label="Course code" htmlFor="courseCode" error={errors.courseCode}><TextInput id="courseCode" value={form.courseCode} onChange={(event) => update('courseCode', event.target.value.toUpperCase())} placeholder="COM 111" disabled={isSubmitting} /></FormField>
            <div className="sm:col-span-1 lg:col-span-2"><FormField label="Course title" htmlFor="courseTitle" error={errors.courseTitle}><TextInput id="courseTitle" value={form.courseTitle} onChange={(event) => update('courseTitle', event.target.value)} disabled={isSubmitting} /></FormField></div>
            <FormField label="Credit unit" htmlFor="creditUnit" error={errors.creditUnit}><TextInput id="creditUnit" type="number" min="1" max="6" value={form.creditUnit} onChange={(event) => update('creditUnit', event.target.value)} disabled={isSubmitting} /></FormField>
            <FormField label="Score" htmlFor="score" error={errors.score}><TextInput id="score" type="number" min="0" max="100" step="0.01" value={form.score} onChange={(event) => update('score', event.target.value)} disabled={isSubmitting} /></FormField>
            <FormField label="Grade" htmlFor="grade" error={errors.grade}><TextInput id="grade" value={form.grade} onChange={(event) => update('grade', event.target.value.toUpperCase())} placeholder="A" disabled={isSubmitting} /></FormField>
            <FormField label="Grade point" htmlFor="gradePoint" error={errors.gradePoint}><TextInput id="gradePoint" type="number" min="0" max="5" step="0.01" value={form.gradePoint} onChange={(event) => update('gradePoint', event.target.value)} disabled={isSubmitting} /></FormField>
          </div>
        </Card>
        <div className="flex justify-end gap-3"><Link to="/academic-records" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><Button type="submit" isLoading={isSubmitting}>{!isSubmitting && <Save className="h-4 w-4" />}{mode === 'edit' ? 'Save changes' : 'Create record'}</Button></div>
      </form>
    </section>
  );
}
