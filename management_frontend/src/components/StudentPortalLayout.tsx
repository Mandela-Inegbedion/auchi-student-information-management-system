import { FileBarChart2, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../context/StudentAuthContext';
import { Button } from './ui/Button';

export function StudentPortalLayout() {
  const { student, logout } = useStudentAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-emerald-900 bg-emerald-950 text-white shadow-2xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-auto lg:shadow-none">
        <div className="flex items-center gap-3 border-b border-emerald-900 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-emerald-50">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Auchi Polytechnic</p>
            <p className="mt-1 text-sm font-bold text-white">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Student navigation">
          <NavLink
            to="/student/portal"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100/90 hover:bg-emerald-900 hover:text-white'
              }`
            }
          >
            <UserRound className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            My Profile
          </NavLink>
          <NavLink
            to="/student/portal/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100/90 hover:bg-emerald-900 hover:text-white'
              }`
            }
          >
            <FileBarChart2 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            My Reports
          </NavLink>
        </nav>

        <div className="border-t border-emerald-900 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold">
              {student?.firstName?.[0]}{student?.lastName?.[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{student?.firstName} {student?.lastName}</p>
              <p className="mt-0.5 truncate text-xs text-emerald-300">{student?.matricNumber}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleLogout}
            isLoading={isSigningOut}
            variant="ghost"
            className="mt-4 w-full border border-emerald-800 text-emerald-50 hover:bg-emerald-900 focus:ring-emerald-800"
          >
            {!isSigningOut && <LogOut className="h-4 w-4" aria-hidden="true" />}
            Logout
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-sm font-bold text-slate-950 sm:text-base">Student Portal</p>
            <p className="hidden text-xs text-slate-500 sm:block">{student?.matricNumber}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">STUDENT</span>
        </header>
        <main className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
