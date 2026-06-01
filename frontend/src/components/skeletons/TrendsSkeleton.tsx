import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Shimmer block with gradient animation.
 */
function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-muted shimmer ${className ?? ''}`}
    />
  );
}

/**
 * TrendsSkeleton — loading placeholder for the Trends page.
 */
export function TrendsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <ShimmerBlock className="h-8 w-48" />
        <ShimmerBlock className="h-4 w-72" />
      </div>

      {/* Word cloud area */}
      <Card>
        <CardContent className="p-8">
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <ShimmerBlock
                  key={i}
                  className={`h-6 rounded-full ${
                    i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-16' : 'w-20'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab content table skeleton */}
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-5 w-16 rounded-full" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="mb-4 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-3 w-full" />
            ))}
          </div>
          {/* Table rows */}
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-3/4" />
                <ShimmerBlock className="h-4 w-1/2" />
                <ShimmerBlock className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
