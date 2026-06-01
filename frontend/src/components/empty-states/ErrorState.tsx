import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/transitions/FadeIn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isMockData?: boolean;
}

/**
 * ErrorState — empty state for API / data-fetching errors.
 * Optionally shows a "mock data" badge when fallback data is in use.
 */
export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load the data. Please try again.",
  onRetry,
  isMockData = false,
}: ErrorStateProps) {
  return (
    <FadeIn direction="up" className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {message}
      </p>
      <div className="flex flex-col items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
        {isMockData && (
          <Badge variant="secondary" className="text-xs">
            Showing fallback data (mock)
          </Badge>
        )}
      </div>
    </FadeIn>
  );
}
