import { History, Search, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { SelectInput, TextInput } from '../../components/ui/FormField';
import { ApiError, apiRequest } from '../../lib/api';
import type { ActivityLog, ActivityLogPagination, ActivityLogUser } from '../../types/activityLog';

const modules = ['AUTH', 'STUDENTS', 'ACADEMIC_RECORDS', 'USERS', 'DEPARTMENTS', 'PROGRAMMES'];
const actions = [
  'LOGIN', 'LOGOUT',
  'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED',
  'ACADEMIC_RECORD_CREATED', 'ACADEMIC_RECORD_UPDATED', 'ACADEMIC_RECORD_DELETED',
  'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED', 'ROLE_CHANGED',
  'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED',
  'PROGRAMME_CREATED', 'PROGRAMME_UPDATED', 'PROGRAMME_DELETED',
];

function humanize(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<ActivityLogUser[]>([]);
  const [pagination, setPagination] = useState<ActivityLogPagination>({ page: 1, pageSize: 15, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    apiRequest<{ users: ActivityLogUser[] }>('/users')
      .then((data) => setUsers(data.users))
      .catch(() => setError('Unable to load user filters.'));
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const query = new URLSearchParams({ page: String(page), pageSize: '15', order });
    if (search) query.set('search', search);
    if (userId) query.set('userId', userId);
    if (module) query.set('module', module);
    if (action) query.set('action', action);

    try {
      const data = await apiRequest<{ logs: ActivityLog[]; pagination: ActivityLogPagination }>(`/activity-logs?${query}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load activity logs.');
    } finally {
      setIsLoading(false);
    }
  }, [action, module, order, page, search, userId]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  const columns: TableColumn<ActivityLog>[] = [
    {
      key: 'time', header: 'Date and time', render: (log) => (
        <div className="whitespace-nowrap"><p className="font-semibold text-slate-900">{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(log.createdAt))}</p><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat('en-NG', { timeStyle: 'medium' }).format(new Date(log.createdAt))}</p></div>
      ),
    },
    { key: 'user', header: 'User', render: (log) => <div><p className="font-bold text-slate-900">{log.user.fullName}</p><p className="mt-1 text-xs text-slate-500">{log.user.email}</p></div> },
    {
      key: 'event', header: 'Event', render: (log) => (
        <div><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">{humanize(log.action)}</span><p className="mt-2 text-xs font-semibold text-slate-500">{humanize(log.module)}</p></div>
      ),
    },
    { key: 'description', header: 'Description', render: (log) => <div><p className="max-w-md text-slate-700">{log.description}</p>{log.recordId && <p className="mt-1 max-w-48 truncate font-mono text-[11px] text-slate-400" title={log.recordId}>ID: {log.recordId}</p>}</div> },
  ];

  return (
    <section className="mx-auto max-w-[1500px]">
      <div><p className="text-sm font-semibold text-emerald-700">Security administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Activity Logs</h1><p className="mt-2 text-sm text-slate-600">Review authenticated actions recorded by the system.</p></div>
      {error && <div className="mt-6"><Alert variant="error">{error}</Alert></div>}

      <Card className="mt-6">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.8fr_1fr_0.7fr] sm:p-6">
          <div className="relative"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><TextInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search activity" className="pl-10" /></div>
          <SelectInput value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }}><option value="">All users</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</SelectInput>
          <SelectInput value={module} onChange={(event) => { setModule(event.target.value); setPage(1); }}><option value="">All modules</option>{modules.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</SelectInput>
          <SelectInput value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><option value="">All actions</option>{actions.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</SelectInput>
          <SelectInput value={order} onChange={(event) => { setOrder(event.target.value as 'asc' | 'desc'); setPage(1); }}><option value="desc">Newest first</option><option value="asc">Oldest first</option></SelectInput>
        </div>
        <CardHeader title={`${pagination.total} audit event${pagination.total === 1 ? '' : 's'}`} description="Logs are generated automatically by authenticated backend operations." action={<ShieldCheck className="h-5 w-5 text-emerald-700" />} />
        <DataTable columns={columns} rows={logs} getRowKey={(log) => log.id} isLoading={isLoading} emptyTitle="No activity logs found" emptyDescription="New authenticated actions will appear here automatically." />
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6"><p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
        )}
      </Card>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><History className="h-4 w-4" />Times are displayed in your local timezone.</div>
    </section>
  );
}
