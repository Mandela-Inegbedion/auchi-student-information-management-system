interface ModulePlaceholderPageProps {
  title: string;
  description: string;
}

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Authorized module</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
      <div className="mt-7 rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-slate-600">{description}</p>
        <p className="mt-3 text-sm text-slate-500">Module functionality will be implemented in its assigned PRD prompt.</p>
      </div>
    </section>
  );
}
