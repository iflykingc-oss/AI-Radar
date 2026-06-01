import { Card, CardContent } from '@/components/ui/card';
import { ProductCardGridSkeleton } from './ProductCardSkeleton';

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
 * DiscoverSkeleton — loading placeholder for the Discover page.
 */
export function DiscoverSkeleton() {
  return (
    <div className="flex gap-6">
      {/* Search bar skeleton */}
      <div className="flex-1 space-y-6">
        <div className="flex gap-3">
          <ShimmerBlock className="h-10 flex-1" />
          <ShimmerBlock className="h-10 w-24" />
        </div>

        {/* Product grid skeleton */}
        <ProductCardGridSkeleton count={9} />
      </div>

      {/* Filter sidebar skeleton */}
      <div className="hidden w-64 shrink-0 space-y-5 lg:block">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <ShimmerBlock className="h-4 w-20" />
              {Array.from({ length: 3 }).map((_, j) => (
                <ShimmerBlock key={j} className="h-3 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
