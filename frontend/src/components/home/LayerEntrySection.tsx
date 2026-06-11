import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Compass, Rocket, TrendingUp, type LucideIcon } from 'lucide-react';
import LayerEntryCard, {
  type LayerAccent,
  type LayerEntryPreview,
} from './LayerEntryCard';

/**
 * Static layer configuration. Kept module-level so the icon / accent
 * mapping is colocated with the only place it is used.
 */
interface LayerConfig {
  layer: 'L1' | 'L2' | 'L3';
  icon: LucideIcon;
  accent: LayerAccent;
  href: string;
}

const LAYER_CONFIG: readonly LayerConfig[] = [
  {
    layer: 'L1',
    icon: Compass,
    accent: 'blue',
    href: '/discover?layer=categories',
  },
  {
    layer: 'L2',
    icon: Rocket,
    accent: 'emerald',
    href: '/launches?range=24h',
  },
  {
    layer: 'L3',
    icon: TrendingUp,
    accent: 'purple',
    href: '/trends?range=7d',
  },
];

/**
 * Per-layer data block fed into `<LayerEntryCard>`.
 * `count = 0` + `items = []` triggers the card's skeleton state.
 */
export interface LayerData {
  count: number;
  items: LayerEntryPreview[];
}

/**
 * Props for `<LayerEntrySection>`.
 *
 * The data fields are optional to preserve W2 prep behaviour: when
 * the home page (or any future caller) hasn't yet fetched the API,
 * we still render the section with placeholder counts of 0.
 *
 * Per ADR-07 this is a Server Component: the home page passes
 * server-fetched data as props and there is **no** `'use client'`
 * boundary here.
 */
export interface LayerEntrySectionProps {
  /** L1 = categories count + top-N preview. */
  l1?: LayerData;
  /** L2 = 24h launches count + top-N preview. */
  l2?: LayerData;
  /** L3 = 7d trends count + top-N preview. */
  l3?: LayerData;
  /** Optional className for the section root. */
  className?: string;
}

/**
 * Back-compat export. The QA engineer / T-1 smoke tests still import
 * `LAYER_PLACEHOLDER` to assert the "no data → 0 / []" behaviour, so
 * we keep it as a stable named export.
 */
export const LAYER_PLACEHOLDER: LayerData = {
  count: 0,
  items: [],
} as const;

/**
 * `<LayerEntrySection>` — composes the three layer entry cards on the
 * home page.
 *
 * Per ADR-07 this is a Server Component: pure Tailwind + Radix UI,
 * no third-party carousel libraries, no client-side hooks. The
 * bilingual copy comes from `useTranslations('home.layers')` (which
 * is server-safe in `next-intl` v3+).
 *
 * ## W2 behaviour
 * The home page (RSC) calls the three W1 API endpoints in parallel
 * (`/api/categories`, `/api/launches?range=24h`, `/api/trends?range=7d`)
 * and passes the resolved data as `l1` / `l2` / `l3` props. If any
 * endpoint fails the home page falls back to `LAYER_PLACEHOLDER`
 * (count 0, no items) so the card renders its built-in skeleton
 * instead of a blank area.
 */
export function LayerEntrySection({
  l1,
  l2,
  l3,
  className,
}: LayerEntrySectionProps) {
  const t = useTranslations('home.layers');

  // Per-layer preview limits (kept here so adding per-layer logic
  // later is a one-line change).
  const l1Data: LayerData = l1 ?? LAYER_PLACEHOLDER;
  const l2Data: LayerData = l2 ?? LAYER_PLACEHOLDER;
  const l3Data: LayerData = l3 ?? LAYER_PLACEHOLDER;
  const dataByLayer: Record<'L1' | 'L2' | 'L3', LayerData> = {
    L1: l1Data,
    L2: l2Data,
    L3: l3Data,
  };

  return (
    <section
      id="home-layers"
      aria-labelledby="home-layers-title"
      className={className ?? 'py-16 lg:py-24'}
      data-testid="layer-entry-section"
    >
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-10 text-center">
          <h2
            id="home-layers-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            <span lang="zh">{t('section_title_zh')}</span>
            <span className="mt-1 block text-2xl text-muted-foreground sm:text-3xl">
              <span lang="en">{t('section_title_en')}</span>
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            <span lang="zh">{t('section_subtitle_zh')}</span>
            <span lang="en" className="mt-1 block text-sm opacity-80">
              {t('section_subtitle_en')}
            </span>
          </p>
        </div>

        {/* 3-card grid — stacks on mobile, 3 columns on lg+ */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LAYER_CONFIG.map((config) => {
            const layerKey = config.layer.toLowerCase() as 'l1' | 'l2' | 'l3';
            const data = dataByLayer[config.layer];
            const isL1 = config.layer === 'L1';
            const isL2 = config.layer === 'L2';

            return (
              <LayerEntryCard
                key={config.layer}
                layer={config.layer}
                icon={config.icon}
                accent={config.accent}
                href={config.href}
                // L1 / L2 / L3 titles, descriptions, CTAs.
                title_zh={t(`${layerKey}.title_zh`)}
                title_en={t(`${layerKey}.title_en`)}
                desc_zh={t(`${layerKey}.desc_zh`)}
                desc_en={t(`${layerKey}.desc_en`)}
                cta_zh={t(`${layerKey}.cta_zh`)}
                cta_en={t(`${layerKey}.cta_en`)}
                // Real count + unit per layer (falls back to 0 on error).
                count={data.count}
                count_unit_zh={t(`${layerKey}.unit_zh`)}
                count_unit_en={t(`${layerKey}.unit_en`)}
                // Real preview items, capped per layer.
                items={data.items}
                previewLimit={isL1 ? 5 : isL2 ? 3 : 3}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LayerEntrySection;
