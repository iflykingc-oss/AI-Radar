import { BookmarkX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/transitions/FadeIn';

/**
 * NoWatchlist — empty state for the watchlist page when no items are saved.
 */
export function NoWatchlist() {
  return (
    <FadeIn direction="up" className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <BookmarkX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold text-foreground">
        Your watchlist is empty
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Save products you&apos;re interested in to track their updates and compare
        them side by side.
      </p>
      <Button variant="default" asChild>
        <Link href="/discover">Discover Products</Link>
      </Button>
    </FadeIn>
  );
}
