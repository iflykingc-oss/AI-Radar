/**
 * AI Radar — /launches Loading State
 *
 * RSC; renders a lightweight skeleton (5 placeholder cards) while the
 * server fetches the launches payload. Mirrors the home page skeleton
 * behaviour so there is no layout shift when the real data arrives.
 */
import { Rocket } from 'lucide-react';

export default function LaunchesLoading() {
  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="launches-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mb-8 flex items-center gap-2">
        <Rocket className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mb-6 h-10 w-full max-w-md animate-pulse rounded-md bg-muted" />
      <ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading launch events"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="h-40 animate-pulse rounded-lg border bg-muted/30"
          />
        ))}
      </ul>
    </div>
  );
}
