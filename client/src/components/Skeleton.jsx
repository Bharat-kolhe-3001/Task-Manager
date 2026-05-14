// Skeleton loader components
export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <SkeletonBlock className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="metric-card">
      <div className="flex justify-between">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-6 w-6 rounded-full" />
      </div>
      <SkeletonBlock className="h-10 w-16" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTaskCard() {
  return (
    <div className="task-card space-y-2 cursor-default">
      <div className="flex justify-between">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-3 w-12" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="flex gap-5 h-full">
      {[1, 2, 3].map(i => (
        <div key={i} className="kanban-col">
          <div className="p-4 border-b border-white/5">
            <SkeletonBlock className="h-5 w-28" />
          </div>
          <div className="p-3 space-y-3">
            {[1, 2, 3].map(j => <SkeletonTaskCard key={j} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
