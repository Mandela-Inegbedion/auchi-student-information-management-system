import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FullPageLoader } from '../components/FullPageLoader';
import { useAuth } from '../context/AuthContext';
import { useStudentAuth } from '../context/StudentAuthContext';
import { ApiError } from '../lib/api';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const { student, isLoading: isStudentLoading, login: studentLogin } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<'student' | 'staff'>('staff');
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || isStudentLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  if (student) return <Navigate to="/student/portal" replace />;

  function switchTab(next: 'student' | 'staff') {
    setTab(next);
    setError('');
    setPassword('');
    setShowPassword(false);
  }

  function fillStudentDemo(matric: string) {
    setMatricNumber(matric);
    setPassword(matric);
    setError('');
  }

  function fillStaffDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  async function handleStaffSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!matricNumber.trim()) {
      setError('Matric number is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentLogin({ matricNumber: matricNumber.trim(), password });
      navigate('/student/portal', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-emerald-700/50" />
        <div className="absolute -bottom-48 -left-24 h-[32rem] w-[32rem] rounded-full bg-emerald-900" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Auchi Polytechnic</p>
          <h1 className="mt-8 max-w-xl text-4xl font-bold leading-tight xl:text-5xl">
            Student Information Management System
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-100/80">
            A trusted institutional workspace for managing accurate academic information.
          </p>
        </div>
        <p className="relative text-sm text-emerald-200/70">Auchi Polytechnic · {new Date().getFullYear()}</p>
      </section>

      <section className="flex items-center justify-center px-5 py-4 sm:px-10 lg:bg-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:border-0 lg:shadow-none">
          <div className="lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Auchi Polytechnic</p>
          </div>

          {/* Tab switcher */}
          <div className="mt-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1 lg:mt-0">
            <button
              type="button"
              onClick={() => switchTab('staff')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === 'staff' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Staff / Admin
            </button>
            <button
              type="button"
              onClick={() => switchTab('student')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === 'student' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student Portal
            </button>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Welcome back</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {tab === 'student' ? 'Sign in with your matric number and password.' : 'Sign in with your administrator or staff account.'}
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          {tab === 'student' ? (
            <form className="mt-4 space-y-3" onSubmit={handleStudentSubmit} noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="matricNumber">
                  Matric number
                </label>
                <input
                  id="matricNumber"
                  type="text"
                  autoComplete="username"
                  value={matricNumber}
                  onChange={(event) => setMatricNumber(event.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  placeholder="Matric number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="studentPassword">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="studentPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter your matric number"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} disabled={isSubmitting} className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-lg bg-emerald-800 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? (<><span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</>) : 'Sign in'}
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Demo access</p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => fillStudentDemo('ICT/6252400567')}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ada Ivie Osagie</p>
                    <p className="mt-0.5 text-xs text-slate-500">ICT/6252400567 · Computer Science</p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Sign in →</span>
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={handleStaffSubmit} noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="name@auchipoly.edu.ng"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={isSubmitting}
                    className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-800 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Demo access</p>
                <div className="space-y-2">
                  <button type="button" disabled={isSubmitting} onClick={() => fillStaffDemo('admin@auchipoly.edu.ng', 'Admin@Sims2026!')} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">System Administrator</p>
                      <p className="mt-0.5 text-xs text-slate-500">admin@auchipoly.edu.ng · ADMIN</p>
                    </div>
                    <span className="ml-3 shrink-0 rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Fill →</span>
                  </button>
                  <button type="button" disabled={isSubmitting} onClick={() => fillStaffDemo('staff@auchipoly.edu.ng', 'Staff@Sims2026!')} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Staff Member</p>
                      <p className="mt-0.5 text-xs text-slate-500">staff@auchipoly.edu.ng · STAFF</p>
                    </div>
                    <span className="ml-3 shrink-0 rounded-md bg-slate-600 px-3 py-1 text-xs font-bold text-white">Fill →</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            {tab === 'student' ? 'Contact the system administrator if you cannot sign in.' : 'Access is monitored. Contact the system administrator if you cannot sign in.'}
          </p>
        </div>
      </section>
    </main>
  );
}
