import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/transitions/FadeIn';
import { CategoryFilterBar } from '@/components/discover/CategoryFilterBar';
import { CategoryGrid } from '@/components/discover/CategoryGrid';
import { DiscoverEmptyState } from '@/components/discover/DiscoverEmptyState';
import { fetchMatureCategories } from '@/lib/api/server';
import { getTranslations, getLocale } from 'next-intl/server';
import type { CategoryLayer, CategoryPricing } from '@/components/discover/CategoryFilterBar';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type Props = {
  searchParams: {
    layer?: string | string[];
    pricing?: string | string[];
  };
};

const ALLOWED_LAYERS: ReadonlyArray<CategoryLayer> = ['mature', 'emerging', 'all'];
const ALLOWED_PRICING: ReadonlyArray<CategoryPricing> = [
  'all',
  'free',
  'freemium',
  'paid',
  'open_source',
];

/**
 * Narrow a raw `getLocale()` result (typed as `string`) to the strict
 * `'en' | 'zh'` union expected by `fetchMatureCategories`. Falls back to
 * `'en'` for any other locale (e.g. `de`, `ja`).
 */
function parseLocale(raw: string): 'en' | 'zh' {
  return raw === 'zh' ? 'zh' : 'en';
}

function parseLayer(raw: string | string[] | undefined): CategoryLayer {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return ALLOWED_LAYERS.includes(value as CategoryLayer)
    ? (value as CategoryLayer)
    : 'mature';
}

function parsePricing(raw: string | string[] | undefined): CategoryPricing {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return ALLOWED_PRICING.includes(value as CategoryPricing)
    ? (value as CategoryPricing)
    : 'all';
}

export default async function DiscoverPage({ searchParams }: Props) {
  const t = await getTranslations('discover');
  const locale = parseLocale(await getLocale());
  const layer = parseLayer(searchParams.layer);
  const pricing = parsePricing(searchParams.pricing);

  // Fetch mature (root) categories from the API.
  // The API does not accept a `?layer=` filter, so we always fetch the
  // tree and filter client-side.
  const data = await fetchMatureCategories(locale);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const hasActiveFilter = layer !== 'mature' || pricing !== 'all';

  return (
    <FadeIn direction="up" duration={0.4}>
      <div className="container mx-auto px-4 py-8 space-y-8" data-testid="discover-page">
        {/* Page Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('browse_categories')}
          </p>
        </header>

        {/* Filter Bar (client component — needs URL state) */}
        <CategoryFilterBar
          layer={layer}
          pricing={pricing}
        />

        {/* Main Content: grid OR empty state */}
        <section
          aria-labelledby="discover-grid-heading"
          data-testid="discover-grid-section"
        >
          <h2 id="discover-grid-heading" className="sr-only">
            {t('categories_heading')}
          </h2>

          {items.length === 0 ? (
            <DiscoverEmptyState hasActiveFilter={hasActiveFilter} />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  {t('categories_found', { count: total || items.length })}
                </CardTitle>
                <CardDescription>{t('subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryGrid items={items} />
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </FadeIn>
  );
}
