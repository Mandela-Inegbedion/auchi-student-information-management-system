import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Access denied</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">You do not have permission to view this page.</h1>
      <p className="mt-4 leading-7 text-slate-600">
        Your account is authenticated, but its assigned role does not include this administrative permission.
      </p>
      <Link
        to="/dashboard"
        className="mt-7 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
      >
        Return to dashboard
      </Link>
    </section>
  );
}
