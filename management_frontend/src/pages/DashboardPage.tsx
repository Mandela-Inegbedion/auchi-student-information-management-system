import { BookOpenCheck, Building2, GraduationCap, RefreshCw, School, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { StatCard } from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';

interface RecentStudent {
  id: string;
  matricNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string;
  createdAt: string;
  department: { name: string; code: string };
  programme: { name: string; code: string };
}

interface RecentActivity {
  id: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
  user: { id: string; fullName: string; role: string };
}

interface DashboardData {
  statistics: {
    totalStudents: number;
    totalDepartments: number;
    totalProgrammes: number;
    totalUsers: number;
  };
  recentStudents: RecentStudent[];
  recentActivity: RecentActivity[];
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

const studentColumns: TableColumn<RecentStudent>[] = [
  {
    key: 'student',
    header: 'Student',
    render: (student) => (
      <div>
        <p className="font-semibold text-slate-900">
          {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}
        </p>
        <p className="mt-1 text-xs text-slate-500">{student.matricNumber}</p>
      </div>
    ),
  },
  {
    key: 'department',
    header: 'Department',
    render: (student) => (
      <div>
        <p className="font-medium text-slate-800">{student.department.code}</p>
        <p className="mt-1 max-w-48 truncate text-xs text-slate-500">{student.programme.name}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (student) => (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-800">
        {student.status.toLowerCase()}
      </span>
    ),
  },
  {
    key: 'registered',
    header: 'Registered',
    render: (student) => dateFormatter.format(new Date(student.createdAt)),
  },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-40 animate-pulse bg-slate-50">
            <span className="sr-only">Loading dashboard statistic</span>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <Card><LoadingState rows={4} /></Card>
        <Card><LoadingState rows={4} /></Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setData(await apiRequest<DashboardData>('/dashboard'));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load dashboard information.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <section className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Institutional overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Welcome back, {user?.fullName.split(' ')[0]}
          </h1>
          <p className="mt-2 text-sm text-slate-600">Live academic and administrative information from the central database.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadDashboard()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error">
            <div className="flex flex-wrap items-center gap-3">
              <span>{error}</span>
              <button className="font-bold underline" type="button" onClick={() => void loadDashboard()}>Try again</button>
            </div>
          </Alert>
        </div>
      )}

      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <div className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Students" value={data.statistics.totalStudents} icon={GraduationCap} caption="All registered students" />
            <StatCard label="Total Departments" value={data.statistics.totalDepartments} icon={Building2} caption="Academic departments" />
            <StatCard label="Total Programmes" value={data.statistics.totalProgrammes} icon={School} caption="Available programmes" />
            <StatCard label="Total Users" value={data.statistics.totalUsers} icon={Users} caption="Authorized system users" />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader title="Recent student registrations" description="The five newest student records in the system." />
              <DataTable
                columns={studentColumns}
                rows={data.recentStudents}
                getRowKey={(student) => student.id}
                emptyTitle="No student registrations"
                emptyDescription="New student records will appear here after registration."
              />
            </Card>

            <Card>
              <CardHeader
                title="Recent activity"
                description={user?.role === 'ADMIN' ? 'Latest security-relevant system actions.' : 'Your latest recorded system actions.'}
              />
              {data.recentActivity.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="No activity recorded yet"
                  description="Authenticated system actions will appear here when activity is recorded."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentActivity.map((activity) => (
                    <li key={activity.id} className="px-5 py-4 sm:px-6">
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{activity.description}</p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {activity.user.fullName} · {dateTimeFormatter.format(new Date(activity.createdAt))}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}
