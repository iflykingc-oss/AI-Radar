import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/transitions/FadeIn';

interface NoProductsProps {
  onClearFilters?: () => void;
}

/**
 * NoProducts — empty state for the discover page when no products are found.
 */
export function NoProducts({ onClearFilters }: NoProductsProps) {
  return (
    <FadeIn direction="up" className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold text-foreground">
        No products found
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Try adjusting your filters or search terms to discover more AI products.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="default">
            Clear all filters
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/discover">Browse all products</Link>
        </Button>
      </div>
    </FadeIn>
  );
}
