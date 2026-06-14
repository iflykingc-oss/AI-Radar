export function NewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border/50 p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted rounded-full" />
                <div className="h-6 w-20 bg-muted rounded-full" />
                <div className="h-6 w-24 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
