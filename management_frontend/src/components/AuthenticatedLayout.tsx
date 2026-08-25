import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { hasPermission, navigationItems } from '../config/permissions';
import { useAuth } from '../context/AuthContext';
import { prefetchApi } from '../lib/api';
import { Button } from './ui/Button';

const navigationPrefetchPaths: Record<string, string[]> = {
  '/dashboard': ['/dashboard'],
  '/students': ['/students/form-options', '/students?page=1&pageSize=10'],
  '/academic-records': ['/academic-records/form-options', '/academic-records?page=1&pageSize=10'],
  '/departments': ['/departments'],
  '/programmes': ['/programmes', '/departments'],
  '/users': ['/users'],
  '/reports': ['/reports?'],
  '/activity-logs': ['/users', '/activity-logs?page=1&pageSize=15&order=desc'],
};

function prefetchNavigation(path: string) {
  navigationPrefetchPaths[path]?.forEach(prefetchApi);
}

export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = user ? navigationItems.filter((item) => hasPermission(user.role, item.permission)) : [];
  const pageTitle = visibleItems.find((item) => location.pathname.startsWith(item.path))?.label ?? 'System';
  const currentDate = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (!user) return undefined;
    const permittedItems = navigationItems.filter((item) => hasPermission(user.role, item.permission));
    const timers = permittedItems.map((item, index) => window.setTimeout(
      () => prefetchNavigation(item.path),
      500 + index * 200,
    ));
    return () => timers.forEach(window.clearTimeout);
  }, [user]);

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell min-h-screen bg-slate-100 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-900 bg-emerald-950 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-emerald-900 px-5 py-6 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-emerald-50">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Auchi Polytechnic</p>
              <p className="mt-1 text-sm font-bold text-white">Student Information</p>
            </div>
          </div>
          <button type="button" className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-900 lg:hidden" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Main navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              onMouseEnter={() => prefetchNavigation(item.path)}
              onFocus={() => prefetchNavigation(item.path)}
              onTouchStart={() => prefetchNavigation(item.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-100/90 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-emerald-900 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold">
              {user?.fullName.split(' ').map((name) => name[0]).slice(0, 2).join('')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName}</p>
              <p className="mt-0.5 text-xs text-emerald-300">{user?.role}</p>
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
        <header className="app-header sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden" onClick={() => setIsMobileOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-950 sm:text-base">{pageTitle}</p>
              <p className="hidden text-xs text-slate-500 sm:block">{currentDate}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{user?.role}</span>
        </header>
        <main className="app-main px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
