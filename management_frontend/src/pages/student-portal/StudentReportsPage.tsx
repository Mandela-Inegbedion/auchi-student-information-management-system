import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Card, CardHeader } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, apiRequest } from '../../lib/api';
import type { AcademicRecord } from '../../types/student';

interface GroupedSemester {
  session: string;
  semester: string;
  records: AcademicRecord[];
  totalUnits: number;
  totalPoints: number;
  gpa: number;
}

function groupBySemester(records: AcademicRecord[]): GroupedSemester[] {
  const map = new Map<string, GroupedSemester>();

  for (const r of records) {
    const key = `${r.session}-${r.semester}`;
    if (!map.has(key)) {
      map.set(key, { session: r.session, semester: r.semester.charAt(0) + r.semester.slice(1).toLowerCase(), records: [], totalUnits: 0, totalPoints: 0, gpa: 0 });
    }
    const group = map.get(key)!;
    group.records.push(r);
    group.totalUnits += r.creditUnit;
    group.totalPoints += Number(r.gradePoint) * r.creditUnit;
  }

  for (const group of map.values()) {
    group.gpa = group.totalUnits > 0 ? group.totalPoints / group.totalUnits : 0;
  }

  return Array.from(map.values());
}

function gradeColor(grade: string) {
  if (['A', 'A+'].includes(grade)) return 'text-emerald-700 font-bold';
  if (['B', 'B+'].includes(grade)) return 'text-blue-700 font-bold';
  if (['C'].includes(grade)) return 'text-amber-600 font-bold';
  return 'text-red-600 font-bold';
}

export function StudentReportsPage() {
  const [groups, setGroups] = useState<GroupedSemester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTranscript = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ records: AcademicRecord[] }>('/student/profile/transcript');
      setGroups(groupBySemester(data.records));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load your academic records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTranscript();
  }, [loadTranscript]);

  if (isLoading) return <Card className="mx-auto max-w-4xl"><LoadingState label="Loading transcript" rows={4} /></Card>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Student Portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">My Academic Report</h1>
        <p className="mt-2 text-sm text-slate-600">Your complete academic record by session and semester.</p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">No academic records found.</p>
            <p className="mt-1 text-xs text-slate-400">Records will appear here once they are added by your department.</p>
          </div>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={`${group.session}-${group.semester}`}>
            <CardHeader
              title={`${group.session} — ${group.semester} Semester`}
              description={`${group.records.length} course${group.records.length !== 1 ? 's' : ''} · ${group.totalUnits} credit units · GPA: ${group.gpa.toFixed(2)}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3 text-left">Code</th>
                    <th className="px-6 py-3 text-left">Course title</th>
                    <th className="px-6 py-3 text-center">Units</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-center">Grade</th>
                    <th className="px-6 py-3 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">{record.courseCode}</td>
                      <td className="px-6 py-4 text-slate-900">{record.courseTitle}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{record.creditUnit}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{Number(record.score).toFixed(0)}</td>
                      <td className={`px-6 py-4 text-center ${gradeColor(record.grade)}`}>{record.grade}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{Number(record.gradePoint).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td colSpan={2} className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Semester GPA</td>
                    <td className="px-6 py-3 text-center text-slate-700">{group.totalUnits}</td>
                    <td />
                    <td />
                    <td className="px-6 py-3 text-center text-emerald-700">{group.gpa.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        ))
      )}
    </section>
  );
}
