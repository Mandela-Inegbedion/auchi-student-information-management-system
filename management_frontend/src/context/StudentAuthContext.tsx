import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import type { StudentAuthUser, StudentLoginCredentials } from '../types/auth';

interface StudentAuthContextValue {
  student: StudentAuthUser | null;
  isLoading: boolean;
  login: (credentials: StudentLoginCredentials) => Promise<StudentAuthUser>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextValue | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiRequest<{ student: StudentAuthUser }>('/student/auth/me')
      .then(({ student: currentStudent }) => {
        if (active) setStudent(currentStudent);
      })
      .catch((error: unknown) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401)) {
          console.error('Unable to restore student session.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: StudentLoginCredentials) => {
    const data = await apiRequest<{ student: StudentAuthUser }>('/student/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setStudent(data.student);
    return data.student;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<never>('/student/auth/logout', { method: 'POST' });
    } finally {
      setStudent(null);
    }
  }, []);

  const value = useMemo(() => ({ student, isLoading, login, logout }), [student, isLoading, login, logout]);

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used inside StudentAuthProvider.');
  return context;
}
