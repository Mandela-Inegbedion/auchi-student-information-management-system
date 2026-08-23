import type { UserRole } from './auth';

export interface ActivityLogUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  recordId: string | null;
  description: string;
  createdAt: string;
  user: ActivityLogUser;
}

export interface ActivityLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
