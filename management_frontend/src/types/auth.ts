export type UserRole = 'ADMIN' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface StudentAuthUser {
  id: string;
  matricNumber: string;
  firstName: string;
  lastName: string;
}

export interface StudentLoginCredentials {
  matricNumber: string;
  password: string;
}
