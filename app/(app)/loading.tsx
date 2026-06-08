export default function Loading() {
  return (
    <div className="page-container animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-7 bg-slate-200 rounded-xl w-56 mb-2.5 shimmer" />
        <div className="h-4 bg-slate-100 rounded-xl w-40 shimmer" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-slate-100 rounded-lg w-20 shimmer" />
              <div className="w-10 h-10 rounded-xl bg-slate-100 shimmer" />
            </div>
            <div className="h-8 bg-slate-200 rounded-xl w-16 shimmer" />
            <div className="h-3 bg-slate-100 rounded-lg w-28 shimmer" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-32 shimmer" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-slate-200 shimmer flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded-lg w-3/4 shimmer" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2 shimmer" />
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 xl:col-span-2 space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-40 shimmer" />
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-slate-100 shimmer flex-shrink-0" />
            <div className="flex-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-lg shimmer" />
                  <div className="h-1.5 bg-slate-100 rounded-full shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
