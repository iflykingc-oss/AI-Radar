export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getFallbackTrends, withSupabaseFallbackTimeout } from '@/lib/api/fallback-data';
import type { TrendRange } from '@/lib/api/types';

/**
 * GET /api/trends
 * Returns paginated trend signals with optional filters.
 *
 * Query params (all optional):
 *   - range: '7d' | '30d' | '90d' (default '7d'; affects description only,
 *           data is pre-aggregated server-side by the worker)
 *   - signal_type: tag_emerging | category_growing | tech_stack_shift | cluster_new | funding_pattern
 *   - status: emerging | peaking | cooling | expired (default excludes 'expired')
 *   - scope_prefix: e.g. 'tag:' | 'category:' | 'stack:'
 *   - min_strength: 0-100 (default 0)
 *   - page: 1-based (default 1)
 *   - limit: page size (default 20, max 100)
 *
 * Response: { code, data: { items, pagination }, message }
 */
const VALID_SIGNAL_TYPES = new Set([
  'tag_emerging',
  'category_growing',
  'tech_stack_shift',
  'cluster_new',
  'funding_pattern',
]);
const VALID_STATUS = new Set(['emerging', 'peaking', 'cooling', 'expired']);
const VALID_RANGE = new Set(['7d', '30d', '90d']);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get('range') || '7d';
    if (!VALID_RANGE.has(range)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid range: ${range}` },
        { status: 400 }
      );
    }

    const signalType = searchParams.get('signal_type');
    if (signalType && !VALID_SIGNAL_TYPES.has(signalType)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid signal_type: ${signalType}` },
        { status: 400 }
      );
    }

    const statusParam = searchParams.get('status');
    if (statusParam && !VALID_STATUS.has(statusParam)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid status: ${statusParam}` },
        { status: 400 }
      );
    }

    const scopePrefix = searchParams.get('scope_prefix');
    const minStrengthRaw = searchParams.get('min_strength');
    let minStrength = 0;
    if (minStrengthRaw !== null) {
      minStrength = parseFloat(minStrengthRaw);
      if (Number.isNaN(minStrength) || minStrength < 0 || minStrength > 100) {
        return NextResponse.json(
          { code: 4001, data: null, message: 'min_strength must be in [0, 100]' },
          { status: 400 }
        );
      }
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    // Build query. We use a separate count query so the product_count can be
    // joined cheaply with a follow-up. To keep it simple and fast, we use the
    // v_trends_active view when no filters are present, and trend_signals
    // directly when filters are applied.
    const useView = !signalType && !scopePrefix && !statusParam;
    const baseTable = useView ? 'v_trends_active' : 'trend_signals';

    let query = supabase
      .from(baseTable as any)
      .select('*', { count: 'exact' });

    if (!useView) {
      // Default: exclude expired
      if (statusParam) {
        query = query.eq('status', statusParam);
      } else {
        query = query.neq('status', 'expired');
      }
      if (signalType) {
        query = query.eq('signal_type', signalType);
      }
    }
    if (scopePrefix) {
      // scope is stored as e.g. "tag:agent-orchestration"; use ilike prefix
      query = query.like('scope', `${scopePrefix}%`);
    }
    if (minStrength > 0) {
      query = query.gte('strength', minStrength);
    }

    query = query.order('strength', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rows, error, count } = await withSupabaseFallbackTimeout(query, 'trends query');
    if (error) {
      console.warn('trends API fallback activated:', error.message ?? error);
      return NextResponse.json({
        code: 0,
        data: getFallbackTrends({
          range: range as TrendRange,
          signalType,
          status: statusParam,
          scopePrefix,
          minStrength,
          page,
          limit,
        }),
        message: 'ok',
      });
    }

    // Compute product_count for items (join product_signals counts).
    const ids = (rows || []).map((r: any) => r.id);
    let counts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: psRows, error: psErr } = await withSupabaseFallbackTimeout(
        supabase
          .from('product_signals')
          .select('signal_id')
          .in('signal_id', ids),
        'trend product signal counts',
      );
      if (!psErr && psRows) {
        for (const row of psRows) {
          counts[(row as any).signal_id] = (counts[(row as any).signal_id] || 0) + 1;
        }
      }
    }

    const items = (rows || []).map((r: any) => ({
      id: r.id,
      signal_type: r.signal_type,
      scope: r.scope,
      title: r.title,
      description: r.description,
      evidence: r.evidence ?? {},
      strength: r.strength,
      velocity: r.velocity,
      novelty: r.novelty,
      first_seen: r.first_seen,
      last_updated: r.last_updated ?? r.first_seen,
      status: r.status,
      product_count: counts[r.id] ?? r.product_count ?? 0,
    }));

    const total = count || 0;
    return NextResponse.json({
      code: 0,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          total_pages: total === 0 ? 0 : Math.ceil(total / limit),
          has_next: page * limit < total,
        },
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('trends API unexpected error:', error);
    return NextResponse.json({
      code: 0,
      data: getFallbackTrends({ range: '7d', page: 1, limit: 20 }),
      message: 'ok',
    });
  }
}
