import {
  BookOpenCheck,
  Building2,
  FileBarChart2,
  Gauge,
  GraduationCap,
  ScrollText,
  School,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../types/auth';

export type Permission =
  | 'viewDashboard'
  | 'manageStudents'
  | 'manageAcademicRecords'
  | 'manageDepartments'
  | 'manageProgrammes'
  | 'manageUsers'
  | 'viewReports'
  | 'viewActivityLogs';

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    'viewDashboard',
    'manageStudents',
    'manageAcademicRecords',
    'manageDepartments',
    'manageProgrammes',
    'manageUsers',
    'viewReports',
    'viewActivityLogs',
  ]),
  STAFF: new Set<Permission>(['viewDashboard', 'manageStudents', 'manageAcademicRecords']),
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}

export interface NavigationItem {
  label: string;
  path: string;
  permission: Permission;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', permission: 'viewDashboard', icon: Gauge },
  { label: 'Students', path: '/students', permission: 'manageStudents', icon: GraduationCap },
  { label: 'Academic Records', path: '/academic-records', permission: 'manageAcademicRecords', icon: BookOpenCheck },
  { label: 'Departments', path: '/departments', permission: 'manageDepartments', icon: Building2 },
  { label: 'Programmes', path: '/programmes', permission: 'manageProgrammes', icon: School },
  { label: 'Users', path: '/users', permission: 'manageUsers', icon: Users },
  { label: 'Reports', path: '/reports', permission: 'viewReports', icon: FileBarChart2 },
  { label: 'Activity Logs', path: '/activity-logs', permission: 'viewActivityLogs', icon: ScrollText },
];
