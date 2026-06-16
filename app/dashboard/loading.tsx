export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] flex">
      {/* Sidebar skeleton */}
      <aside className="w-64 hidden lg:flex flex-col bg-white border-r border-slate-200 p-5 h-screen sticky top-0">
        <div className="w-24 h-7 bg-slate-100 rounded-xl mb-8 animate-pulse" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </aside>

      {/* Content skeleton */}
      <main className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
      </main>
    </div>
  );
}
