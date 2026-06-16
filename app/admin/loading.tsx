export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* Sidebar skeleton */}
      <aside className="w-64 hidden lg:flex flex-col bg-[#16161E] border-r border-[#1E1E2E] p-5 h-screen sticky top-0">
        <div className="w-28 h-7 bg-white/10 rounded-xl mb-8 animate-pulse" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/10 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="h-8 w-52 bg-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        </div>
      </main>
    </div>
  );
}
