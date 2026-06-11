'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

/**
 * Imperative success-toast wrapper for the newsletter form. Used by
 * pages that need to surface a success notification outside the form
 * (e.g. after a re-activation flow or a programmatic subscribe call).
 *
 * Renders nothing — it just fires a single toast on mount, then is safe
 * to unmount. The default `<NewsletterForm>` already toasts on success;
 * this component is for the rare programmatic paths.
 */
export interface NewsletterSuccessToastProps {
  /**
   * When `true`, fires a toast on mount. Defaults to `true`.
   * Set to `false` for declarative control.
   */
  fire?: boolean;
  /** Optional override for the toast title. */
  title?: string;
  /** Optional override for the toast description. */
  description?: string;
  /** Optional duration override (ms). */
  duration?: number;
}

export function NewsletterSuccessToast({
  fire = true,
  title,
  description,
  duration = 5000,
}: NewsletterSuccessToastProps) {
  const t = useTranslations('newsletter');
  const { toast } = useToast();

  useEffect(() => {
    if (!fire) return;
    toast({
      type: 'success',
      title: title ?? t('success_title'),
      description: description ?? t('success_description'),
      duration,
    });
    // We intentionally don't include `toast` in the deps — the hook
    // returns a stable callback per the implementation in useToast.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  return (
    <span className="sr-only" aria-hidden="true">
      <CheckCircle2 className="hidden" />
      {title ?? t('success_title')}
    </span>
  );
}

export default NewsletterSuccessToast;
