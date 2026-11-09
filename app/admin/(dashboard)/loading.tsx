const blocks = Array.from({ length: 8 }, (_, index) => index);

export default function AdminDashboardLoading() {
  return <div className="animate-pulse space-y-6" aria-label="Loading Admin data" aria-live="polite">
    <div className="h-4 w-40 bg-slate-200" />
    <div className="h-9 w-72 max-w-full bg-slate-300" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {blocks.map((block) => <div key={block} className="h-32 border border-slate-300 bg-white p-4"><div className="h-3 w-24 bg-slate-200" /><div className="mt-6 h-8 w-28 bg-slate-300" /></div>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-2"><div className="h-72 border border-slate-300 bg-white" /><div className="h-72 border border-slate-300 bg-white" /></div>
    <span className="sr-only">Loading current business data</span>
  </div>;
}
