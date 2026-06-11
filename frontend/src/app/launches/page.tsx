/**
 * AI Radar — /launches Page (Server Component, T-1 P0)
 *
 * File: frontend/src/app/launches/page.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1 (T-1):
 *   - RSC, 数据服务端拉
 *   - 调 `/api/launches?range&page&page_size=30&category`
 *   - URL 同步: `searchParams.range` (24h/7d/30d/90d) + `searchParams.page` + `searchParams.category`
 *   - 无效 range → throw → 交给 `error.tsx` 兜底
 *   - 0 条 → `<LaunchEmptyState />`
 *   - 失败 → 静默降级为空数据 (不抛)
 *
 * AC-2 验收 (per PRD §5.2):
 *   - AC-2.1 GET /launches?range=24h → ≥1 个 `data-testid="launch-timeline-card"`
 *   - AC-2.2 7d / 30d 切换正常
 *   - AC-2.4 ?range=99h → 错误态 (无卡片 + 错误提示)
 */
import { getTranslations } from 'next-intl/server';
import { Rocket } from 'lucide-react';
import {
  fetchCategoriesServer,
  fetchLaunchesServer,
} from '@/lib/api/server';
import type {
  CategoryItem,
  LaunchItem,
  LaunchRange,
  PaginatedData,
} from '@/lib/api/types';
import { LaunchTimeline } from '@/components/launches/LaunchTimeline';
import { LaunchEmptyState } from '@/components/launches/LaunchEmptyState';
import { LaunchFilterBar } from '@/components/launches/LaunchFilterBar';
import { LaunchPagination } from '@/components/launches/LaunchPagination';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const VALID_RANGES = new Set<LaunchRange>(['24h', '7d', '30d', '90d', 'all']);
const PAGE_SIZE = 30;

export interface LaunchesPageProps {
  searchParams?: {
    range?: string;
    page?: string;
    category?: string;
  };
}

export default async function LaunchesPage({ searchParams }: LaunchesPageProps) {
  const t = await getTranslations('launches');

  // ---- parse + validate searchParams ----
  const rawRange = (searchParams?.range ?? '24h') as LaunchRange;
  const range: LaunchRange = VALID_RANGES.has(rawRange) ? rawRange : '24h';
  const invalidRange = !VALID_RANGES.has(
    (searchParams?.range ?? '24h') as LaunchRange,
  );
  const rawPage = parseInt(searchParams?.page ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const category = searchParams?.category?.trim() || undefined;

  // ---- parallel fetch: launches + categories (for filter dropdown) ----
  const [launchesResult, categoriesResult] = await Promise.all([
    fetchLaunchesServer({
      range,
      page,
      page_size: PAGE_SIZE,
      category,
      revalidate: 60,
    }),
    fetchCategoriesServer({
      order_by: 'display_order',
      include_empty: true,
      lang: 'zh',
      revalidate: 300,
    }),
  ]);

  // Categories for the filter dropdown. Fall back to empty on error.
  const categoryItems: CategoryItem[] = categoriesResult?.items ?? [];

  // If the requested range is invalid, render the error state inline
  // (per AC-2.4). We don't `throw` so the rest of the page chrome
  // (header, filter bar) still renders.
  if (invalidRange) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Header t={t} range={range} />
        <LaunchFilterBar
          range={range}
          category={category ?? ''}
          categories={categoryItems}
          invalidRange={true}
        />
        <LaunchEmptyState variant="error" />
      </div>
    );
  }

  // If the launches endpoint failed, render a graceful empty state
  // with the error copy rather than throwing. `launchesResult` is
  // `PaginatedData<LaunchItem> | null` (per `fetchLaunchesServer`).
  const payload: PaginatedData<LaunchItem> | null = launchesResult;
  const items: LaunchItem[] = payload?.items ?? [];
  const pagination = payload?.pagination ?? {
    page,
    page_size: PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_next: false,
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="launches-page">
      <Header t={t} range={range} />

      <LaunchFilterBar
        range={range}
        category={category ?? ''}
        categories={categoryItems}
      />

      {items.length === 0 ? (
        <LaunchEmptyState
          variant={category ? 'filtered' : 'empty'}
          category={category}
        />
      ) : (
        <LaunchTimeline items={items} locale={range} />
      )}

      {pagination.total > 0 && (
        <LaunchPagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          hasNext={pagination.has_next}
          range={range}
          category={category ?? ''}
          total={pagination.total}
          pageSize={pagination.page_size}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local sub-component: page header. Inlined to keep `page.tsx`       */
/* self-contained for the T-1 manifest.                                */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  t: Awaited<ReturnType<typeof getTranslations<'launches'>>>;
  range: LaunchRange;
}

function Header({ t, range }: HeaderProps) {
  return (
    <header className="mb-8 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Rocket className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          <span lang="zh">{t('page_title')}</span>
          <span className="block text-lg text-muted-foreground sm:ml-2 sm:inline sm:text-2xl">
            <span lang="en">/ New Launches</span>
          </span>
        </h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
        <span lang="zh">
          {range === '24h' ? t('subtitle_zh') : `过去 ${range} 的 AI 新品`}
        </span>
        <span lang="en" className="ml-2 block text-xs opacity-80 sm:inline">
          {range === '24h'
            ? t('subtitle_en')
            : `AI launches in the past ${range}`}
        </span>
      </p>
    </header>
  );
}
