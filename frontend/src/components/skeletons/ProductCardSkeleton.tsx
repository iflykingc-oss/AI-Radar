import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Shimmer skeleton block with smooth gradient animation.
 */
function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'shimmer rounded-md bg-muted',
        className,
      )}
    />
  );
}

/**
 * ProductCardSkeleton — loading placeholder for a product card in grid view.
 */
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        {/* Logo placeholder */}
        <div className="mb-4 flex items-start gap-3">
          <ShimmerBlock className="h-12 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-5 w-3/4" />
            <ShimmerBlock className="h-3 w-1/2" />
          </div>
        </div>

        {/* Description lines */}
        <div className="mb-4 space-y-2">
          <ShimmerBlock className="h-3 w-full" />
          <ShimmerBlock className="h-3 w-5/6" />
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          <ShimmerBlock className="h-5 w-14 rounded-full" />
          <ShimmerBlock className="h-5 w-20 rounded-full" />
          <ShimmerBlock className="h-5 w-16 rounded-full" />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between border-t pt-3">
          <ShimmerBlock className="h-4 w-16" />
          <ShimmerBlock className="h-4 w-12" />
          <ShimmerBlock className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ProductCardGridSkeleton — renders multiple ProductCardSkeleton in a responsive grid.
 */
export function ProductCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
