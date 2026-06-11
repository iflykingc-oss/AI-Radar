export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getFallbackLaunches, withSupabaseFallbackTimeout } from '@/lib/api/fallback-data';
import type { LaunchRange } from '@/lib/api/types';

/**
 * GET /api/launches
 * Returns paginated launch events with optional filters.
 *
 * Query params (all optional):
 *   - range: '24h' | '7d' | '30d' | '90d' | 'all'  (default '24h')
 *   - source: producthunt | hackernews | github | x | arxiv | huggingface | rss | xiaohongshu
 *   - event_type: launch | major_update | open_source | funding | milestone | pricing_change
 *   - category: product category slug (joined through products)
 *   - min_confidence: 0-1 (default 0)
 *   - page: 1-based page number (default 1)
 *   - limit: page size (default 20, max 100)
 *
 * Response: { code, data: { items, pagination: { page, limit, total, total_pages, has_next } }, message }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get('range') || '24h';
    const source = searchParams.get('source');
    const eventType = searchParams.get('event_type');
    const category = searchParams.get('category');
    const minConfidenceRaw = searchParams.get('min_confidence');

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    // Range -> seconds cutoff
    const rangeToSeconds: Record<string, number | null> = {
      '24h': 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
      '90d': 90 * 24 * 60 * 60,
      all: null,
    };
    if (!(range in rangeToSeconds)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid range: ${range}` },
        { status: 400 }
      );
    }

    let minConfidence = 0;
    if (minConfidenceRaw !== null) {
      minConfidence = parseFloat(minConfidenceRaw);
      if (Number.isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1) {
        return NextResponse.json(
          { code: 4001, data: null, message: 'min_confidence must be in [0, 1]' },
          { status: 400 }
        );
      }
    }

    // Build base query: select joined fields via FK relationship.
    // We use `products:product_id(...)` style to embed product info.
    let query = supabase
      .from('launch_events')
      .select(
        'id, product_id, source, source_url, event_type, title, body, author, engagement, detected_at, event_at, confidence, products:product_id(slug, name, logo_url, category)',
        { count: 'exact' }
      )
      .order('event_at', { ascending: false, nullsFirst: false });

    // Apply range filter on event_at (or detected_at as fallback)
    const seconds = rangeToSeconds[range];
    if (seconds !== null) {
      const since = new Date(Date.now() - seconds * 1000).toISOString();
      query = query.gte('event_at', since);
    }

    if (source) {
      query = query.eq('source', source);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (minConfidence > 0) {
      query = query.gte('confidence', minConfidence);
    }
    if (category) {
      // We need to filter on the joined products.category. Supabase-js doesn't
      // support direct joined-column equality filters in a stable way, so we
      // first resolve matching product_ids, then filter on product_id.
      const { data: productMatches, error: prodErr } = await withSupabaseFallbackTimeout(
        supabase
          .from('products')
          .select('id')
          .eq('category', category),
        'launches category lookup',
      );
      if (prodErr) {
        console.warn('launches category fallback activated:', prodErr.message ?? prodErr);
        return NextResponse.json({
          code: 0,
          data: getFallbackLaunches({
            range: range as LaunchRange,
            source,
            eventType,
            category,
            minConfidence,
            page,
            limit,
          }),
          message: 'ok',
        });
      }
      const ids = (productMatches || []).map((p) => p.id);
      if (ids.length === 0) {
        // No products in this category -> empty page is the correct answer
        return NextResponse.json({
          code: 0,
          data: {
            items: [],
            pagination: { page, page_size: limit, limit, total: 0, total_pages: 0, has_next: false },
          },
          message: 'ok',
        });
      }
      query = query.in('product_id', ids);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rows, error, count } = await withSupabaseFallbackTimeout(query, 'launches query');
    if (error) {
      console.warn('launches API fallback activated:', error.message ?? error);
      return NextResponse.json({
        code: 0,
        data: getFallbackLaunches({
          range: range as LaunchRange,
          source,
          eventType,
          category,
          minConfidence,
          page,
          limit,
        }),
        message: 'ok',
      });
    }

    const items = (rows || []).map((r: any) => {
      const product = r.products || null;
      return {
        id: r.id,
        product_id: r.product_id,
        product_slug: product?.slug ?? null,
        product_name: product?.name ?? null,
        product_logo_url: product?.logo_url ?? null,
        source: r.source,
        source_url: r.source_url,
        event_type: r.event_type,
        title: r.title,
        body: r.body,
        author: r.author,
        engagement: r.engagement ?? {},
        detected_at: r.detected_at,
        event_at: r.event_at,
        confidence: r.confidence,
      };
    });

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
    console.error('launches API unexpected error:', error);
    return NextResponse.json({
      code: 0,
      data: getFallbackLaunches({ range: '24h', page: 1, limit: 20 }),
      message: 'ok',
    });
  }
}
