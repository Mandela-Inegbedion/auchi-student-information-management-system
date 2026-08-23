import { Pencil, Plus, Search, ShieldCheck, UserCheck, UserRoundCog, UserX, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { FormField, SelectInput, TextInput } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { ApiError, apiRequest } from '../../lib/api';
import type { UserRole } from '../../types/auth';
import type { ManagedUser, UserFormData } from '../../types/user';

const emptyForm: UserFormData = { fullName: '', email: '', password: '', role: 'STAFF' };

function badgeClasses(value: 'ADMIN' | 'STAFF' | 'ACTIVE' | 'INACTIVE') {
  if (value === 'ACTIVE') return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (value === 'INACTIVE') return 'bg-slate-100 text-slate-600 ring-slate-200';
  if (value === 'ADMIN') return 'bg-purple-50 text-purple-800 ring-purple-200';
  return 'bg-blue-50 text-blue-800 ring-blue-200';
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  async function loadUsers() {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ users: ManagedUser[] }>('/users');
      setUsers(data.users);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || `${user.fullName} ${user.email}`.toLowerCase().includes(term);
      return matchesSearch && (!roleFilter || user.role === roleFilter) && (!statusFilter || user.status === statusFilter);
    });
  }, [roleFilter, search, statusFilter, users]);

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(user: ManagedUser) {
    setEditingUser(user);
    setForm({ fullName: user.fullName, email: user.email, password: '', role: user.role });
    setFormErrors({});
    setError('');
    setIsFormOpen(true);
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (form.fullName.trim().length < 3) nextErrors.fullName = 'Enter the user’s full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!editingUser || form.password) {
      if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
        nextErrors.password = 'Use at least 8 characters with uppercase, lowercase, and a number.';
      }
    }
    if (!['ADMIN', 'STAFF'].includes(form.role)) nextErrors.role = 'Select a valid role.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest<{ user: ManagedUser }>(editingUser ? `/users/${editingUser.id}` : '/users', {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(`User ${editingUser ? 'updated' : 'created'} successfully.`);
      setIsFormOpen(false);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changeStatus(user: ManagedUser, status: 'ACTIVE' | 'INACTIVE') {
    setIsStatusUpdating(true);
    setError('');
    try {
      await apiRequest<{ user: ManagedUser }>(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSuccess(`${user.fullName} was ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to update user status.');
      setStatusTarget(null);
    } finally {
      setIsStatusUpdating(false);
    }
  }

  const columns: TableColumn<ManagedUser>[] = [
    {
      key: 'user', header: 'User', render: (user) => (
        <div><p className="font-bold text-slate-900">{user.fullName}{user.id === currentUser?.id && <span className="ml-2 text-xs font-semibold text-emerald-700">You</span>}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></div>
      ),
    },
    { key: 'role', header: 'Role', render: (user) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeClasses(user.role)}`}>{user.role}</span> },
    { key: 'status', header: 'Status', render: (user) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeClasses(user.status)}`}>{user.status}</span> },
    { key: 'created', header: 'Created', render: (user) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(user.createdAt)) },
    {
      key: 'actions', header: 'Actions', className: 'text-right', render: (user) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => openEditForm(user)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" aria-label={`Edit ${user.fullName}`}><Pencil className="h-4 w-4" /></button>
          {user.status === 'ACTIVE' ? (
            <button type="button" onClick={() => setStatusTarget(user)} disabled={user.id === currentUser?.id} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Deactivate ${user.fullName}`} title={user.id === currentUser?.id ? 'You cannot deactivate your own account' : 'Deactivate user'}><UserX className="h-4 w-4" /></button>
          ) : (
            <button type="button" onClick={() => void changeStatus(user, 'ACTIVE')} disabled={isStatusUpdating} className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label={`Activate ${user.fullName}`}><UserCheck className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Security administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">User Management</h1><p className="mt-2 text-sm text-slate-600">Create accounts, assign access roles, and control account status.</p></div>
        <Button type="button" onClick={openCreateForm}><Plus className="h-4 w-4" />Add user</Button>
      </div>

      <div className="mt-6 space-y-4">{success && <Alert variant="success">{success}</Alert>}{error && !isFormOpen && <Alert variant="error">{error}</Alert>}</div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Total users</p><p className="mt-2 text-3xl font-bold text-slate-950">{users.length}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Administrators</p><p className="mt-2 text-3xl font-bold text-slate-950">{users.filter((user) => user.role === 'ADMIN').length}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-slate-500">Active accounts</p><p className="mt-2 text-3xl font-bold text-slate-950">{users.filter((user) => user.status === 'ACTIVE').length}</p></Card>
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-[1fr_180px_180px] sm:p-6">
          <div className="relative"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="pl-10" /></div>
          <SelectInput value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option><option value="ADMIN">Admin</option><option value="STAFF">Staff</option></SelectInput>
          <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></SelectInput>
        </div>
        <CardHeader title={`${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'}`} description="Password credentials are securely stored and never shown here." action={<ShieldCheck className="h-5 w-5 text-emerald-700" />} />
        <DataTable columns={columns} rows={filteredUsers} getRowKey={(user) => user.id} isLoading={isLoading} emptyTitle="No users found" emptyDescription="Create a user or adjust the current filters." />
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
              <div className="flex gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><UserRoundCog className="h-5 w-5" /></span><div><h2 id="user-form-title" className="text-xl font-bold text-slate-950">{editingUser ? 'Edit user' : 'Create user'}</h2><p className="mt-1 text-sm text-slate-500">{editingUser ? 'Update account details or reset the password.' : 'Set up secure system access.'}</p></div></div>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close user form"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitUser} className="space-y-5 p-5 sm:p-6" noValidate>
              {error && <Alert variant="error">{error}</Alert>}
              <FormField label="Full name" htmlFor="fullName" error={formErrors.fullName}><TextInput id="fullName" autoComplete="name" value={form.fullName} onChange={(event) => { setForm({ ...form, fullName: event.target.value }); setFormErrors({ ...formErrors, fullName: undefined }); }} disabled={isSubmitting} /></FormField>
              <FormField label="Email address" htmlFor="email" error={formErrors.email}><TextInput id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => { setForm({ ...form, email: event.target.value }); setFormErrors({ ...formErrors, email: undefined }); }} disabled={isSubmitting} /></FormField>
              <FormField label={editingUser ? 'New password (optional)' : 'Password'} htmlFor="password" error={formErrors.password} hint={editingUser ? 'Leave blank to keep the current password.' : 'At least 8 characters with uppercase, lowercase, and a number.'}><TextInput id="password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => { setForm({ ...form, password: event.target.value }); setFormErrors({ ...formErrors, password: undefined }); }} disabled={isSubmitting} /></FormField>
              <FormField label="Role" htmlFor="role" error={formErrors.role} hint={editingUser?.id === currentUser?.id ? 'You cannot change your own administrator role.' : undefined}><SelectInput id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} disabled={isSubmitting || editingUser?.id === currentUser?.id}><option value="STAFF">Staff</option><option value="ADMIN">Administrator</option></SelectInput></FormField>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" isLoading={isSubmitting}>{editingUser ? 'Save changes' : 'Create user'}</Button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title="Deactivate user?"
        description={statusTarget ? `${statusTarget.fullName} will immediately lose access to the system. Their account can be activated again later.` : ''}
        confirmLabel="Deactivate user"
        isConfirming={isStatusUpdating}
        onConfirm={() => statusTarget && void changeStatus(statusTarget, 'INACTIVE')}
        onClose={() => setStatusTarget(null)}
      />
    </section>
  );
}
