export default function WorkerLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* Sidebar skeleton */}
      <aside className="w-20 hidden lg:flex flex-col items-center bg-[#16161E] border-r border-[#1E1E2E] py-6 gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" />
        <div className="flex-1 flex flex-col gap-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="h-8 w-48 bg-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="h-52 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        <div className="h-40 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
      </main>
    </div>
  );
}
