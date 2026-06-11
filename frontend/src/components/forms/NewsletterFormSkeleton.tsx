'use client';

import * as React from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { NewsletterVariant } from './NewsletterForm';

/**
 * Skeleton placeholder for `<NewsletterForm>`. Rendered when the parent
 * is hydrating (e.g. the Footer is being SSR'd) and the actual form
 * data is not yet available. Mirrors the layout of the real form so
 * the swap is visually seamless.
 */
export interface NewsletterFormSkeletonProps {
  variant?: NewsletterVariant;
  className?: string;
}

export function NewsletterFormSkeleton({
  variant = 'footer',
  className,
}: NewsletterFormSkeletonProps) {
  const isInline = variant === 'inline';
  return (
    <div
      className={cn(
        'w-full animate-pulse',
        isInline ? 'max-w-md' : 'max-w-sm',
        className,
      )}
      data-newsletter-skeleton={variant}
      aria-busy="true"
      aria-live="polite"
    >
      {isInline && (
        <div className="mb-3 space-y-1">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm">
            <span className="sr-only">Email</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <div className="h-10 w-full rounded-md border bg-muted pl-9" />
          </div>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">
            <span className="sr-only">Frequency</span>
          </legend>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
            <div className="h-14 flex-1 rounded-md border bg-muted" />
            <div className="h-14 flex-1 rounded-md border bg-muted" />
          </div>
        </fieldset>

        <div className="flex h-10 w-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="sr-only">Loading newsletter form…</span>
        </div>
      </div>
    </div>
  );
}

export default NewsletterFormSkeleton;
