export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/products/:slug/signals
 *
 * NOTE on route param name:
 *   The brief calls this `/api/products/:id/signals`, but Next.js disallows
 *   two different dynamic params at the same path level. The existing
 *   `/api/products/[slug]/route.ts` already uses `[slug]`, so to keep the
 *   build clean we mirror that convention here. The handler accepts BOTH:
 *     - a UUID id  -> `eq('id', ...)`
 *     - a slug     -> `eq('slug', ...)`
 *   so the public URL surface is unchanged for callers using either form.
 *
 * Returns a product plus all trend signals linked to it (via product_signals)
 * and its recent launch events.
 *
 * Response: { code, data: { product, signals, launches }, message }
 *   - product: full product row (404 -> 4003)
 *   - signals: trend signals joined through product_signals (sorted by relevance desc)
 *   - launches: recent launch events for this product (last 20)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug: lookup } = params;
    const { searchParams } = new URL(request.url);
    const minRelevanceRaw = searchParams.get('min_relevance');
    let minRelevance = 0;
    if (minRelevanceRaw !== null) {
      const parsed = parseFloat(minRelevanceRaw);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
        return NextResponse.json(
          { code: 4001, data: null, message: 'min_relevance must be in [0, 1]' },
          { status: 400 }
        );
      }
      minRelevance = parsed;
    }

    // 1. Lookup product by id (UUID) or slug
    const lookupColumn = UUID_RE.test(lookup) ? 'id' : 'slug';
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq(lookupColumn, lookup)
      .maybeSingle();
    if (prodErr) {
      console.error('product signals: product lookup error:', prodErr);
      return NextResponse.json(
        { code: 5001, data: null, message: 'Failed to fetch product' },
        { status: 500 }
      );
    }
    if (!product) {
      return NextResponse.json(
        { code: 4003, data: null, message: 'product not found' },
        { status: 404 }
      );
    }

    const productId = product.id;

    // 2. Related signals via product_signals join
    const { data: psRows, error: psErr } = await supabase
      .from('product_signals')
      .select('signal_id, relevance, trend_signals:signal_id(id, signal_type, scope, title, strength, velocity, status, last_updated)')
      .eq('product_id', productId)
      .gte('relevance', minRelevance)
      .order('relevance', { ascending: false });
    if (psErr) {
      console.error('product signals: ps lookup error:', psErr);
      // Non-fatal: still return product with empty signals
    }

    const signals = (psRows || [])
      .map((r: any) => {
        const t = r.trend_signals;
        if (!t) return null;
        return {
          id: t.id,
          signal_type: t.signal_type,
          scope: t.scope,
          title: t.title,
          strength: t.strength,
          velocity: t.velocity,
          status: t.status,
          last_updated: t.last_updated,
          relevance: r.relevance,
        };
      })
      .filter(Boolean);

    // 3. Recent launch events for this product
    const { data: launchRows, error: launchErr } = await supabase
      .from('launch_events')
      .select('id, source, source_url, event_type, title, body, author, engagement, detected_at, event_at, confidence')
      .eq('product_id', productId)
      .order('event_at', { ascending: false, nullsFirst: false })
      .limit(20);
    if (launchErr) {
      console.error('product signals: launches lookup error:', launchErr);
    }

    return NextResponse.json({
      code: 0,
      data: {
        product,
        signals,
        launches: launchRows || [],
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('product signals API unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
