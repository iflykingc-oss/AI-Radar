import * as React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading state for `/newsletter/confirmed`. Renders while the parent
 * route segment is being prepared (rare for an RSC page, but Next.js
 * will mount this during the first paint if the route is pre-fetched).
 */
export default function NewsletterConfirmedLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div
        className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </main>
  );
}
