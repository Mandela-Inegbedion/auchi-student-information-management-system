import { Navigate, Route, Routes } from 'react-router-dom';
import { FullPageLoader } from './components/FullPageLoader';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { PermissionRoute } from './components/PermissionRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentPortalLayout } from './components/StudentPortalLayout';
import { StudentProtectedRoute } from './components/StudentProtectedRoute';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { StudentFormPage } from './pages/students/StudentFormPage';
import { StudentProfilePage } from './pages/students/StudentProfilePage';
import { StudentsPage } from './pages/students/StudentsPage';
import { DepartmentFormPage } from './pages/departments/DepartmentFormPage';
import { DepartmentsPage } from './pages/departments/DepartmentsPage';
import { ProgrammeFormPage } from './pages/programmes/ProgrammeFormPage';
import { ProgrammesPage } from './pages/programmes/ProgrammesPage';
import { AcademicRecordFormPage } from './pages/academic-records/AcademicRecordFormPage';
import { AcademicRecordsPage } from './pages/academic-records/AcademicRecordsPage';
import { UsersPage } from './pages/users/UsersPage';
import { ActivityLogsPage } from './pages/activity-logs/ActivityLogsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { StudentLoginPage } from './pages/student-portal/StudentLoginPage';
import { StudentPortalPage } from './pages/student-portal/StudentPortalPage';
import { StudentPortalEditPage } from './pages/student-portal/StudentPortalEditPage';
import { StudentReportsPage } from './pages/student-portal/StudentReportsPage';

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<PermissionRoute permission="manageStudents" />}>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new" element={<StudentFormPage mode="create" />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage mode="edit" />} />
          </Route>
          <Route element={<PermissionRoute permission="manageAcademicRecords" />}>
            <Route path="/academic-records" element={<AcademicRecordsPage />} />
            <Route path="/academic-records/new" element={<AcademicRecordFormPage mode="create" />} />
            <Route path="/academic-records/:id/edit" element={<AcademicRecordFormPage mode="edit" />} />
          </Route>
          <Route element={<PermissionRoute permission="manageDepartments" />}>
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/new" element={<DepartmentFormPage mode="create" />} />
            <Route path="/departments/:id/edit" element={<DepartmentFormPage mode="edit" />} />
          </Route>
          <Route element={<PermissionRoute permission="manageProgrammes" />}>
            <Route path="/programmes" element={<ProgrammesPage />} />
            <Route path="/programmes/new" element={<ProgrammeFormPage mode="create" />} />
            <Route path="/programmes/:id/edit" element={<ProgrammeFormPage mode="edit" />} />
          </Route>
          <Route element={<PermissionRoute permission="manageUsers" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<PermissionRoute permission="viewReports" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<PermissionRoute permission="viewActivityLogs" />}>
            <Route path="/activity-logs" element={<ActivityLogsPage />} />
          </Route>
          <Route element={<PermissionRoute permission="manageSettings" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<StudentProtectedRoute />}>
        <Route element={<StudentPortalLayout />}>
          <Route path="/student/portal" element={<StudentPortalPage />} />
          <Route path="/student/portal/edit" element={<StudentPortalEditPage />} />
          <Route path="/student/portal/reports" element={<StudentReportsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
