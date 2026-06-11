import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * `/newsletter/confirmed` — Server Component success page.
 *
 * Hit after the user clicks the confirmation link in the mock email
 * (the link is `/api/newsletter/confirm?token=xxx`, which will eventually
 * redirect to this page once we wire up the redirect). Also reachable
 * directly for QA / dev.
 *
 * Reads `searchParams.lang` to render the right copy. Defaults to
 * `en` when not present.
 *
 * This is a server component so the i18n strings are resolved at
 * request time (we don't pass through the client provider for SSR
 * translations here — the strings are minimal enough to be hard-coded
 * for now; they will move to the `newsletter` namespace in P0.5 when
 * the confirmation redirect lands).
 */
export default function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: { lang?: string; email?: string };
}) {
  const lang: 'en' | 'zh' = searchParams?.lang === 'zh' ? 'zh' : 'en';

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {lang === 'zh' ? '订阅确认成功' : 'Subscription confirmed'}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'zh'
            ? '感谢订阅 AI Radar 邮件简报。'
            : 'Thanks for subscribing to the AI Radar newsletter.'}
        </p>

        {searchParams?.email ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="font-mono">{searchParams.email}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/discover" className="inline-flex items-center gap-1.5">
              {lang === 'zh' ? '开始探索' : 'Start exploring'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/trends">
              {lang === 'zh' ? '查看趋势' : 'See trends'}
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {lang === 'zh'
            ? '没有收到确认邮件？请检查垃圾邮件文件夹，或返回订阅页面重试。'
            : "Didn't get a confirmation email? Check your spam folder, or return to the subscribe page to retry."}
        </p>
      </div>
    </main>
  );
}
