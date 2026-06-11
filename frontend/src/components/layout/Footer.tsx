import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { getServerPlan } from '@/lib/auth/plan';

/**
 * Server component: reads the plan cookie and passes
 * `defaultDailyLocked` to the newsletter form so the daily radio is
 * disabled in SSR HTML for free users (W2 smoke T2-019).
 */
export default async function Footer() {
  const [t, tNav, tNewsletter] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getTranslations('newsletter'),
  ]);

  // Server-side plan detection — matches `usePlan()`'s default ('free')
  // when no cookie is set, which is the safe default for SSR.
  const plan = await getServerPlan();
  const defaultDailyLocked = plan === 'free';

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                AI
              </div>
              <span className="font-bold">AI Radar</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI Startup Opportunity Validation Platform. Discover, validate, and track AI products automatically.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/discover">{tNav('discover')}</Link></li>
              <li><Link href="/watchlist">{tNav('watchlist')}</Link></li>
              <li><Link href="/compare">{tNav('compare')}</Link></li>
              <li><Link href="/trends">{tNav('trends')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#">API Docs</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li><Link href="#">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#">About</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy">{t('privacy')}</Link></li>
              <li><Link href="/terms">{t('terms')}</Link></li>
              <li><Link href="/cookie-settings">{t('cookies')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="grid gap-6 border-t pt-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h4 className="font-semibold mb-2">{tNewsletter('footer_title')}</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              {tNewsletter('footer_description')}
            </p>
            <NewsletterForm
              variant="footer"
              source="home_footer"
              data-testid="newsletter-form-footer"
              defaultDailyLocked={defaultDailyLocked}
            />
          </div>
          <div className="flex flex-col items-start justify-between gap-4 lg:items-end">
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
