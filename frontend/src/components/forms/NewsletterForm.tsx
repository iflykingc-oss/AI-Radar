'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Sparkles, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlan } from '@/hooks/usePlan';
import { useNewsletterSubmit } from '@/hooks/useNewsletterSubmit';
import type {
  NewsletterFrequency,
  NewsletterSource,
} from '@/lib/api/types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * Visual variants of the newsletter form.
 * - `footer`: compact, single-column, fits the global footer.
 * - `inline`: larger, with title/description, used inside content pages.
 */
export type NewsletterVariant = 'footer' | 'inline';

export interface NewsletterFormProps {
  variant?: NewsletterVariant;
  /** Source tag sent to the API for analytics. */
  source: NewsletterSource;
  /** Optional className applied to the outer wrapper. */
  className?: string;
  /**
   * Optional `data-testid` forwarded to the outermost wrapper. Used by
   * smoke tests to disambiguate multiple instances on the same page
   * (e.g. footer vs. inline). Defaults to `newsletter-form`.
   */
  'data-testid'?: string;
  /**
   * Server-side initial lock state for the `daily` frequency radio.
   * When the form is rendered inside a server component (e.g. Footer)
   * that can read the `plan` cookie, this lets the SSR HTML include
   * the `disabled` attribute on the daily radio for free users —
   * without waiting for client hydration. Defaults to `undefined`,
   * which means the form falls back to the client-side hydration gate
   * (locks AFTER mount, not in SSR).
   *
   * Must match the client's `usePlan()` result on first paint; pass
   * `true` when the server-detected plan is `free`, `false` otherwise.
   */
  defaultDailyLocked?: boolean;
}

/**
 * Email validation regex — kept in sync with the API's `EMAIL_RE`.
 * The client check is purely for UX (instant feedback); the server is
 * still the source of truth.
 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Daily frequency requires Starter+ plan. The dialog copy is derived
 * from the plan tier; this constant is the only place the gating rule
 * lives in the form layer.
 */
const DAILY_FREQUENCY: NewsletterFrequency = 'daily';
const DEFAULT_FREQUENCY: NewsletterFrequency = 'weekly';
const PAYWALL_DIALOG_COOLDOWN_MS = 300; // delay before opening to avoid double-click flash

/**
 * `<NewsletterForm>` — the public subscription form.
 *
 * Two variants:
 * - `footer`: minimal, single-line email + frequency + submit. Stacks
 *   tightly in a 5-column footer grid.
 * - `inline`: hero title + description + bigger input, designed to sit
 *   inside a content page (e.g. `/launches`).
 *
 * Plan gating: the `daily` frequency radio is disabled for free users;
 * clicking it opens a `Dialog` that points them to the pricing page.
 * We intentionally do NOT use `<PaywallGate>` for the daily option — we
 * want to keep the rest of the form (weekly) usable, which the gate
 * wrapper would block.
 */
export function NewsletterForm({
  variant = 'footer',
  source,
  className,
  'data-testid': testId = 'newsletter-form',
  defaultDailyLocked,
}: NewsletterFormProps) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const language: 'en' | 'zh' = locale?.startsWith('zh') ? 'zh' : 'en';

  const { plan, hydrated, hasFeature } = usePlan();
  const { toast } = useToast();
  const {
    submit,
    status,
    errorKind,
    rateLimited,
    rateLimitSeconds,
    reset,
  } = useNewsletterSubmit();

  const [email, setEmail] = useState<string>('');
  const [frequency, setFrequency] = useState<NewsletterFrequency>(
    DEFAULT_FREQUENCY,
  );
  const [emailTouched, setEmailTouched] = useState<boolean>(false);
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);

  const isSubmitting = status === 'submitting';
  // Lock state: prefer the server-provided initial value (so the daily
  // radio is disabled in SSR HTML for free users); after client
  // hydration, recompute from the live plan via `usePlan()`. Until the
  // client hydrates, fall back to `defaultDailyLocked ?? false`.
  const dailyLocked = hydrated
    ? !hasFeature('newsletter.daily')
    : defaultDailyLocked === true;

  // When the form first mounts, force the radio back to `weekly` if the
  // persisted frequency is `daily` and the plan is free. (Risk R-6.)
  useEffect(() => {
    if (hydrated && dailyLocked && frequency === DAILY_FREQUENCY) {
      setFrequency(DEFAULT_FREQUENCY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, dailyLocked]);

  // Surface API errors as toasts. We do this in an effect (not inline in
  // the catch) so the parent component has full control over the toast
  // copy and the form can re-render with its own error state.
  useEffect(() => {
    if (status !== 'error' || !errorKind) return;

    const messageKey = mapErrorKindToKey(errorKind);
    if (!messageKey) return;

    toast({
      type: 'error',
      title: t(messageKey.title),
      description: messageKey.description
        ? t(messageKey.description, {
            seconds: rateLimitSeconds > 0 ? rateLimitSeconds : 60,
          })
        : undefined,
      duration: messageKey.duration ?? 4000,
    });
    // Reset status to `idle` so the same error doesn't re-fire on every
    // re-render. The toast has been shown; we don't need to keep the
    // `error` state in the form.
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, errorKind, rateLimitSeconds]);

  // Surface success as a toast AND reset the form so the user can submit
  // a different email. (We don't auto-redirect to /newsletter/confirmed
  // because that page is for the email-link confirmation flow.)
  useEffect(() => {
    if (status !== 'success') return;
    toast({
      type: 'success',
      title: t('success_title'),
      description: t('success_description'),
      duration: 5000,
    });
    setEmail('');
    setFrequency(DEFAULT_FREQUENCY);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleFrequencyChange = useCallback(
    (next: NewsletterFrequency) => {
      if (next === DAILY_FREQUENCY && dailyLocked) {
        setPaywallOpen(true);
        // Don't change the radio — the user must confirm via the
        // dialog first. This is the R-6 mitigation.
        return;
      }
      setFrequency(next);
    },
    [dailyLocked],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEmailTouched(true);
      if (!EMAIL_RE.test(email.trim()) || rateLimited || isSubmitting) return;

      // Final guard: even if the radio got desynced (e.g. SSR race),
      // never submit `daily` from a free plan.
      const finalFrequency: NewsletterFrequency =
        frequency === DAILY_FREQUENCY && dailyLocked
          ? DEFAULT_FREQUENCY
          : frequency;

      await submit({
        email: email.trim(),
        frequency: finalFrequency,
        language,
        source,
      });
    },
    [email, frequency, dailyLocked, rateLimited, isSubmitting, submit, language, source],
  );

  const isInline = variant === 'inline';
  const emailInvalid =
    emailTouched && email.length > 0 && !EMAIL_RE.test(email.trim());

  return (
    <div
      className={cn(
        'w-full',
        isInline ? 'max-w-md' : 'max-w-sm',
        className,
      )}
      data-newsletter-variant={variant}
      data-newsletter-source={source}
      data-testid={testId}
    >
      {isInline && (
        <div className="mb-3 space-y-1">
          <h3 className="text-base font-semibold">{t('inline_title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('inline_description')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor={`newsletter-email-${variant}`} className="text-sm">
            {t('email_label')}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`newsletter-email-${variant}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={t('email_placeholder')}
              disabled={isSubmitting}
              aria-invalid={emailInvalid}
              aria-describedby={
                emailInvalid ? `newsletter-email-error-${variant}` : undefined
              }
              className="pl-9"
              data-testid="newsletter-email"
            />
          </div>
          {emailInvalid && (
            <p
              id={`newsletter-email-error-${variant}`}
              className="text-xs text-destructive"
              role="alert"
            >
              {t('error_invalid_email')}
            </p>
          )}
        </div>

        <fieldset className="space-y-1.5" disabled={isSubmitting}>
          <legend className="text-sm font-medium">
            {t('frequency_label')}
          </legend>
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:gap-3">
            <FrequencyOption
              value={DEFAULT_FREQUENCY}
              label={t('frequency_weekly')}
              description={t('frequency_weekly_desc')}
              checked={frequency === DEFAULT_FREQUENCY}
              onChange={() => handleFrequencyChange(DEFAULT_FREQUENCY)}
              id={`newsletter-freq-weekly-${variant}`}
            />
            <FrequencyOption
              value={DAILY_FREQUENCY}
              label={t('frequency_daily')}
              description={t('frequency_daily_desc')}
              checked={frequency === DAILY_FREQUENCY}
              onChange={() => handleFrequencyChange(DAILY_FREQUENCY)}
              id={`newsletter-freq-daily-${variant}`}
              locked={dailyLocked}
              lockBadge={
                <Badge variant="secondary" className="ml-1.5">
                  <Lock className="mr-1 h-3 w-3" />
                  {t('frequency_daily_locked')}
                </Badge>
              }
            />
          </div>
        </fieldset>

        <Button
          type="submit"
          disabled={isSubmitting || rateLimited}
          className="w-full"
          data-testid="newsletter-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : rateLimited ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('error_rate_limit', { seconds: rateLimitSeconds })}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('submit_button')}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">{t('privacy_notice')}</p>
      </form>

      {/* Paywall dialog: appears when a free user clicks the `daily` radio. */}
      <Dialog
        open={paywallOpen}
        onOpenChange={(open) => {
          setPaywallOpen(open);
          if (!open) {
            // R-6: force the radio back to `weekly` on close to avoid
            // stale `daily` selection if the user comes back later.
            setFrequency(DEFAULT_FREQUENCY);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <Badge variant="secondary" className="w-fit">
              <Sparkles className="mr-1 h-3 w-3" />
              {t('paywall_badge')}
            </Badge>
            <DialogTitle className="mt-2">{t('paywall_title')}</DialogTitle>
            <DialogDescription>
              {t('paywall_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setPaywallOpen(false)}
              aria-label={t('paywall_dismiss')}
            >
              {t('paywall_dismiss')}
            </Button>
            <Button asChild>
              <a href="/pricing" onClick={() => setPaywallOpen(false)}>
                {t('paywall_cta')}
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Internal: a single frequency radio option. Exposed as a sub-component
 * to keep the JSX in the main form readable.
 */
interface FrequencyOptionProps {
  value: NewsletterFrequency;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  id: string;
  locked?: boolean;
  lockBadge?: React.ReactNode;
}

function FrequencyOption({
  value,
  label,
  description,
  checked,
  onChange,
  id,
  locked = false,
  lockBadge,
}: FrequencyOptionProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex flex-1 cursor-pointer items-start gap-2 rounded-md border p-2.5 transition-colors',
        checked
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50',
        locked && 'cursor-not-allowed opacity-90',
      )}
      data-frequency-option={value}
      data-frequency-locked={locked ? 'true' : 'false'}
    >
      <input
        id={id}
        type="radio"
        name="newsletter-frequency"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={locked}
        className="mt-1 h-4 w-4 cursor-pointer accent-primary"
        data-testid={`newsletter-freq-${value}`}
      />
      <span className="flex-1 space-y-0.5">
        <span className="flex items-center text-sm font-medium">
          {label}
          {lockBadge}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

/**
 * Helper: map the `ErrorKind` returned by `useNewsletterSubmit` to a
 * pair of i18n keys (title + optional description). Returns `null` for
 * kinds that shouldn't be surfaced (e.g. network — handled differently).
 */
function mapErrorKindToKey(
  kind: ReturnType<typeof useNewsletterSubmit>['errorKind'],
): {
  title: string;
  description?: string;
  duration?: number;
} | null {
  switch (kind) {
    case 'invalid_email':
      return { title: 'error_invalid_email' };
    case 'already_subscribed':
      return { title: 'error_already_subscribed' };
    case 'rate_limit':
      return {
        title: 'error_rate_limit_title',
        description: 'error_rate_limit',
        duration: 5000,
      };
    case 'server':
      return { title: 'error_server', duration: 5000 };
    case 'network':
      return { title: 'error_network', duration: 5000 };
    default:
      return null;
  }
}

export default NewsletterForm;
