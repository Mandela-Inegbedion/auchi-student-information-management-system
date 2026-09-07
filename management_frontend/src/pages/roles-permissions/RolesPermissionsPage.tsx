import { Check, ShieldCheck } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';

const permissions = [
  ['View dashboard', 'viewDashboard'],
  ['Manage student records', 'manageStudents'],
  ['Manage academic records', 'manageAcademicRecords'],
  ['Manage departments', 'manageDepartments'],
  ['Manage programmes', 'manageProgrammes'],
  ['Manage users', 'manageUsers'],
  ['View reports', 'viewReports'],
  ['View activity logs', 'viewActivityLogs'],
  ['Manage system settings', 'manageSettings'],
  ['Manage roles and permissions', 'manageRolesPermissions'],
] as const;

const roleAccess = {
  ADMIN: new Set(permissions.map(([, key]) => key)),
  STAFF: new Set(['viewDashboard', 'manageStudents', 'manageAcademicRecords']),
} as const;

export function RolesPermissionsPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Security administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Roles and permissions</h1>
        <p className="mt-2 text-sm text-slate-600">Review the access granted to each system role.</p>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Access matrix"
          description="Roles are predefined to keep access consistent across the system. Assign a role from User Management."
          action={<ShieldCheck className="h-5 w-5 text-emerald-700" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Permission</th>
                <th className="px-6 py-4 text-center">Admin</th>
                <th className="px-6 py-4 text-center">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map(([label, key]) => (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{label}</td>
                  <td className="px-6 py-4 text-center">
                    {roleAccess.ADMIN.has(key) && <Check className="mx-auto h-5 w-5 text-emerald-700" aria-label="Allowed" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {roleAccess.STAFF.has(key) && <Check className="mx-auto h-5 w-5 text-emerald-700" aria-label="Allowed" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
