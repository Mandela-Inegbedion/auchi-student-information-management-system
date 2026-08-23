import type { UserRole, UserStatus } from './auth';

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}
