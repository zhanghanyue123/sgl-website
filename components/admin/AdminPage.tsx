export function AdminPage({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <main className="mx-auto max-w-7xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-sglInk pb-5"><div>{eyebrow && <p className="text-xs font-black uppercase tracking-[.25em] opacity-60">{eyebrow}</p>}<h1 className="mt-1 text-4xl font-black uppercase md:text-6xl">{title}</h1></div>{action}</header>{children}</main>;
}

export function PermissionDenied() {
  return <AdminPage title="Permission denied"><p className="border border-sglInk bg-white p-6">Your role cannot access this section.</p></AdminPage>;
}

export const adminButton = "inline-flex items-center justify-center border border-sglInk bg-sglAcid px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0_#111] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#111] disabled:opacity-50";
export const adminInput = "w-full border border-sglInk bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sglAcid";
