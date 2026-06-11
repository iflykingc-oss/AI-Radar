/**
 * AI Radar — `<LaunchTimelineCard>` (Server Component, T-1 P0)
 *
 * File: frontend/src/components/launches/LaunchTimelineCard.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Single launch event card used inside `<LaunchTimeline>`.
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1 (T-1) and PRD §5.2 AC-2.1:
 *   - Renders one launch event with bilingual title, source badge, event
 *     type chip, confidence, relative time, and engagement summary.
 *   - Carries `data-testid="launch-timeline-card"` for QA selectors.
 *   - RSC-only: no `'use client'`, no hooks. Server-renderable.
 *   - Falls back to a "data syncing" placeholder when an item is missing
 *     critical fields (defensive — shouldn't happen in production).
 */
import * as React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Star,
  ThumbsUp,
  MessageSquare,
  GitFork,
  Repeat,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LaunchItem, LaunchEventType, LaunchSource } from '@/lib/api/types';

/**
 * Props for `<LaunchTimelineCard>`.
 */
export interface LaunchTimelineCardProps {
  /** The launch event to render. */
  item: LaunchItem;
  /** Optional className appended to the card root. */
  className?: string;
}

/**
 * Event type → Chinese label + colour accent.
 */
const EVENT_TYPE_META: Record<
  LaunchEventType,
  { label_zh: string; label_en: string; classes: string }
> = {
  launch: {
    label_zh: '新品发布',
    label_en: 'Launch',
    classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  major_update: {
    label_zh: '重大更新',
    label_en: 'Major update',
    classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  open_source: {
    label_zh: '开源',
    label_en: 'Open source',
    classes: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  funding: {
    label_zh: '融资',
    label_en: 'Funding',
    classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  milestone: {
    label_zh: '里程碑',
    label_en: 'Milestone',
    classes: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
  pricing_change: {
    label_zh: '价格调整',
    label_en: 'Pricing',
    classes: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  },
};

/**
 * Source → human-readable label (bilingual).
 */
const SOURCE_META: Record<LaunchSource, { label: string; label_en: string }> = {
  producthunt: { label: 'Product Hunt', label_en: 'Product Hunt' },
  hackernews: { label: 'Hacker News', label_en: 'Hacker News' },
  github: { label: 'GitHub', label_en: 'GitHub' },
  x: { label: 'X (Twitter)', label_en: 'X' },
  arxiv: { label: 'arXiv', label_en: 'arXiv' },
  huggingface: { label: 'HuggingFace', label_en: 'HuggingFace' },
  rss: { label: 'RSS', label_en: 'RSS' },
  xiaohongshu: { label: '小红书', label_en: 'Xiaohongshu' },
};

/**
 * Single engagement metric block.
 */
interface EngagementMetric {
  icon: LucideIcon;
  value: number;
  label: string;
}

/**
 * Extract non-zero engagement metrics from a launch item. Order:
 * upvotes → stars → comments → forks → retweets → likes.
 */
function pickEngagementMetrics(item: LaunchItem): EngagementMetric[] {
  const e = item.engagement ?? {};
  const out: EngagementMetric[] = [];
  if (typeof e.upvotes === 'number' && e.upvotes > 0) {
    out.push({ icon: ThumbsUp, value: e.upvotes, label: 'upvotes' });
  }
  if (typeof e.stars === 'number' && e.stars > 0) {
    out.push({ icon: Star, value: e.stars, label: 'stars' });
  }
  if (typeof e.comments === 'number' && e.comments > 0) {
    out.push({ icon: MessageSquare, value: e.comments, label: 'comments' });
  }
  if (typeof e.forks === 'number' && e.forks > 0) {
    out.push({ icon: GitFork, value: e.forks, label: 'forks' });
  }
  if (typeof e.retweets === 'number' && e.retweets > 0) {
    out.push({ icon: Repeat, value: e.retweets, label: 'retweets' });
  }
  if (typeof e.likes === 'number' && e.likes > 0) {
    out.push({ icon: ThumbsUp, value: e.likes, label: 'likes' });
  }
  return out;
}

/**
 * Format a timestamp as a relative-time string (locale-agnostic).
 *
 * Uses stable SSR/CSR-friendly output: a coarse-grained relative
 * ("3h", "2d", "5w", "1y") so server and client agree on the text
 * and React doesn't warn about hydration mismatches.
 */
function formatRelativeTime(iso: string): { zh: string; en: string } {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) {
    return { zh: '未知时间', en: 'unknown' };
  }
  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) {
    return { zh: '刚刚', en: 'just now' };
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return { zh: `${diffMin} 分钟前`, en: `${diffMin}m ago` };
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return { zh: `${diffHr} 小时前`, en: `${diffHr}h ago` };
  }
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) {
    return { zh: `${diffDay} 天前`, en: `${diffDay}d ago` };
  }
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) {
    return { zh: `${diffWk} 周前`, en: `${diffWk}w ago` };
  }
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) {
    return { zh: `${diffMo} 个月前`, en: `${diffMo}mo ago` };
  }
  const diffYr = Math.floor(diffDay / 365);
  return { zh: `${diffYr} 年前`, en: `${diffYr}y ago` };
}

/**
 * Format a count for display (locale-agnostic).
 */
function formatCount(n: number): string {
  if (n >= 10000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return n.toLocaleString('en-US');
}

/**
 * Confidence percentage (0-100). Clamp + round to nearest int.
 */
function formatConfidence(confidence: number): number {
  if (!Number.isFinite(confidence)) return 0;
  const clamped = Math.max(0, Math.min(1, confidence));
  return Math.round(clamped * 100);
}

/**
 * Renders a confidence chip with a colour tier:
 *   - ≥80%: emerald (high)
 *   - ≥50%: blue (medium)
 *   - <50%: muted (low)
 */
function confidenceTierClasses(pct: number): string {
  if (pct >= 80) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }
  if (pct >= 50) {
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
  }
  return 'bg-muted text-muted-foreground';
}

/**
 * `<LaunchTimelineCard>` — single launch event card.
 *
 * Used inside `<LaunchTimeline>`. Server-renderable. No client state.
 */
export function LaunchTimelineCard({ item, className }: LaunchTimelineCardProps) {
  const eventMeta = EVENT_TYPE_META[item.event_type] ?? EVENT_TYPE_META.launch;
  const sourceMeta = SOURCE_META[item.source] ?? {
    label: item.source,
    label_en: item.source,
  };
  const metrics = pickEngagementMetrics(item).slice(0, 4);
  const rel = formatRelativeTime(item.event_at || item.detected_at);
  const confidencePct = formatConfidence(item.confidence);
  const productHref = item.product_slug
    ? `/products/${item.product_slug}`
    : null;

  return (
    <Card
      data-testid="launches-card"
      data-legacy-testid="launch-timeline-card"
      data-launch-id={item.id}
      data-event-type={item.event_type}
      data-source={item.source}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden transition-all',
        'hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-5">
        {/* Header row: event-type chip + source + relative time */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="secondary"
            className={cn('font-medium', eventMeta.classes)}
          >
            <span lang="zh">{eventMeta.label_zh}</span>
            <span lang="en" className="ml-1 text-[10px] opacity-75">
              {eventMeta.label_en}
            </span>
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            <span lang="zh">{sourceMeta.label}</span>
            <span lang="en" className="ml-1 text-[10px] opacity-75">
              {sourceMeta.label_en}
            </span>
          </Badge>
          <span
            className="ml-auto text-xs text-muted-foreground"
            title={item.event_at || item.detected_at}
          >
            <span lang="zh">{rel.zh}</span>
            <span lang="en" className="ml-1 text-[10px] opacity-75">
              {rel.en}
            </span>
          </span>
        </div>

        {/* Title (product name) — primary link target if we have a slug */}
        <div className="space-y-1">
          {productHref ? (
            <Link
              href={productHref}
              className="text-base font-semibold leading-snug hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
            >
              <span lang="zh">{item.product_name || item.title}</span>
              <span lang="en" className="ml-1 text-sm text-muted-foreground font-normal">
                / {item.product_name || item.title}
              </span>
            </Link>
          ) : (
            <h3 className="text-base font-semibold leading-snug">
              <span lang="zh">{item.product_name || item.title}</span>
              <span lang="en" className="ml-1 text-sm text-muted-foreground font-normal">
                / {item.product_name || item.title}
              </span>
            </h3>
          )}
          {/* Event title (separate from product name) */}
          {item.title && item.title !== item.product_name && (
            <p className="text-sm text-foreground/80 line-clamp-2">
              {item.title}
            </p>
          )}
        </div>

        {/* Body (optional, line-clamped) */}
        {item.body && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.body}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">
            <span lang="zh">分类</span>
            <span lang="en" className="ml-1 opacity-75">category</span>
            <span className="ml-1 font-medium text-foreground/80">
              {eventMeta.label_en}
            </span>
          </span>
          {item.author && (
            <span>
              <span lang="zh">作者</span>
              <span lang="en" className="ml-1 opacity-75">by</span>
              <span className="ml-1 font-medium text-foreground/80">
                {item.author}
              </span>
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: engagement metrics + confidence + view links */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
          {metrics.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <span
                    key={m.label}
                    className="inline-flex items-center gap-1"
                    aria-label={`${formatCount(m.value)} ${m.label}`}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    <span className="font-medium text-foreground/80">
                      {formatCount(m.value)}
                    </span>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-muted-foreground/70 italic">
              <span lang="zh">暂无数据</span>
              <span lang="en" className="ml-1 opacity-75">no engagement yet</span>
            </span>
          )}

          <Badge
            variant="secondary"
            className={cn(
              'ml-auto text-[10px] font-medium',
              confidenceTierClasses(confidencePct),
            )}
            title={`Confidence: ${confidencePct}%`}
          >
            <span lang="zh">置信度</span>
            <span lang="en" className="ml-0.5 opacity-75">conf</span>
            <span className="ml-1 font-semibold">{confidencePct}%</span>
          </Badge>
        </div>

        {/* Source link (open in new tab) */}
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
            data-testid="launch-source-link"
          >
            <span lang="zh">查看原文</span>
            <span lang="en" className="opacity-75">view source</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default LaunchTimelineCard;
