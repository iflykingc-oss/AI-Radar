import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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
 * ProductDetailSkeleton — full-page loading placeholder for the product detail view.
 */
export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main content */}
      <div className="space-y-6">
        {/* Hero section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <ShimmerBlock className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-3">
                <ShimmerBlock className="h-7 w-2/3" />
                <ShimmerBlock className="h-4 w-1/3" />
                <div className="space-y-2 pt-2">
                  <ShimmerBlock className="h-3 w-full" />
                  <ShimmerBlock className="h-3 w-5/6" />
                  <ShimmerBlock className="h-3 w-4/6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <ShimmerBlock className="mx-auto mb-2 h-3 w-20" />
                <ShimmerBlock className="mx-auto h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 7D Verification progress bars */}
        <Card>
          <CardHeader>
            <ShimmerBlock className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <ShimmerBlock className="h-3 w-24" />
                  <ShimmerBlock className="h-3 w-10" />
                </div>
                <Progress value={0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar skeleton */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <ShimmerBlock className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShimmerBlock className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-10 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
