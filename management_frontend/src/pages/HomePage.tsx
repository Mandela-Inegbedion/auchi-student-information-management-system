import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { FullPageLoader } from '../components/FullPageLoader';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="relative isolate flex min-h-screen items-center overflow-hidden bg-emerald-950 px-6 py-16 text-white sm:px-10 lg:px-16">
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full border border-emerald-700/50" />
        <div className="absolute -bottom-64 -left-40 h-[38rem] w-[38rem] rounded-full bg-emerald-900" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-800 text-emerald-50">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Auchi Polytechnic</p>
            </div>
            <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Student information management</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Accurate academic information, securely managed.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-100/80 sm:text-lg">
              A trusted digital workspace for student records, academic results, institutional administration, and student self-service.
            </p>
            <p className="mt-10 text-sm text-emerald-200/70">Web-based Student Information Management System</p>
          </div>

          <div className="rounded-2xl border border-emerald-800 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Access the system</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Choose the portal that matches your account.</p>

            <div className="mt-6 space-y-3">
              <Link
                to="/login"
                className="flex items-center justify-between rounded-lg bg-emerald-800 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <span>Staff / Admin Login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/student/login"
                className="flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <span>Student Portal Login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
