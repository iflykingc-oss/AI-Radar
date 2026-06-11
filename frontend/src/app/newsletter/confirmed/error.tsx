'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error boundary for `/newsletter/confirmed`. Catches uncaught errors
 * in the page (or its children) and renders a recovery UI. Per
 * Next.js 14 App Router conventions, this MUST be a Client Component
 * and MUST export `default`.
 */
export default function NewsletterConfirmedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the browser console for the dev server; in production this
    // would forward to a monitoring service.
    console.error('[newsletter/confirmed] route error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div
        className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm"
        role="alert"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t display the confirmation page. Please try again, or
          return to the homepage.
        </p>

        {error?.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            ref: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
