'use client';

/**
 * AI Radar — /launches Error Boundary
 *
 * 'use client' per Next.js App Router convention for `error.tsx`.
 * Catches uncaught errors from the RSC (e.g. thrown from data
 * fetchers) and shows a retry button that re-fetches the page.
 */
import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LaunchesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for now; a real deployment would forward this
    // to the project's error reporting endpoint.
    // eslint-disable-next-line no-console
    console.error('[launches] page error:', error);
  }, [error]);

  return (
    <div
      className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="launches-error"
      role="alert"
    >
      <AlertTriangle
        className="mb-4 h-12 w-12 text-destructive"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-semibold">
        <span lang="zh">加载失败，请稍后重试</span>
        <span className="ml-2 text-lg text-muted-foreground">
          <span lang="en">/ Failed to load</span>
        </span>
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        <span lang="zh">页面遇到了一个错误。你可以点击重试，或返回首页继续浏览。</span>
        <span lang="en" className="mt-1 block text-xs opacity-80">
          The page hit an unexpected error. You can retry, or return home.
        </span>
      </p>
      {error?.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">
          digest: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCw className="mr-2 h-4 w-4" />
          <span lang="zh">重试</span>
          <span lang="en" className="ml-1 opacity-75">
            Retry
          </span>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <span lang="zh">返回首页</span>
            <span lang="en" className="ml-1 opacity-75">
              Back home
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
