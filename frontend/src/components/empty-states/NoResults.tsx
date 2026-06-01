import { FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/transitions/FadeIn';

interface NoResultsProps {
  onClearFilters?: () => void;
  suggestions?: string[];
}

/**
 * NoResults — empty state for search/filter with no matching results.
 * Includes clickable suggestion chips for quick re-searching.
 */
export function NoResults({ onClearFilters, suggestions = [] }: NoResultsProps) {
  return (
    <FadeIn direction="up" className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileSearch className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold text-foreground">
        No matching results
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t find any products matching your criteria. Try broadening your
        search or clearing some filters.
      </p>
      {onClearFilters && (
        <Button onClick={onClearFilters} variant="default" className="mb-4">
          Clear Filters
        </Button>
      )}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </FadeIn>
  );
}
