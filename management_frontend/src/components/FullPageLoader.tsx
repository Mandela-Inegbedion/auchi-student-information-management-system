export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading your account…</p>
      </div>
    </div>
  );
}
