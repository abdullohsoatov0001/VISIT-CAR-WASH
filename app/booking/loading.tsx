export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Steps bar */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        {/* Title */}
        <div className="h-8 w-56 bg-white/10 rounded-xl animate-pulse" />
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-white/5 border border-white/10 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        {/* Button */}
        <div className="h-14 bg-white/10 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
