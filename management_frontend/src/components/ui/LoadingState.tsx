export function LoadingState({ label = 'Loading information…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-3 p-5 sm:p-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-slate-100 p-4">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
