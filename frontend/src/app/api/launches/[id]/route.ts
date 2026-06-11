import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/launches/:id
 * Returns a single launch event by id, joined with the associated product.
 *
 * Response: { code, data, message }
 *   4003 -> launch not found
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    // UUID sanity check (very loose: must be 36 chars with dashes; supabase will
    // surface a more specific error otherwise).
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!uuidLike) {
      return NextResponse.json(
        { code: 4003, data: null, message: 'launch not found' },
        { status: 404 }
      );
    }

    const { data: row, error } = await supabase
      .from('launch_events')
      .select(
        'id, product_id, source, source_url, source_id, event_type, title, body, author, engagement, detected_at, event_at, confidence, raw_data, products:product_id(id, slug, name, logo_url, category, description, tags, website_url)'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('launch detail API error:', error);
      return NextResponse.json(
        { code: 5001, data: null, message: 'Failed to fetch launch' },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { code: 4003, data: null, message: 'launch not found' },
        { status: 404 }
      );
    }

    const product = (row as any).products || null;
    return NextResponse.json({
      code: 0,
      data: {
        id: row.id,
        product_id: row.product_id,
        product_slug: product?.slug ?? null,
        product_name: product?.name ?? null,
        product_logo_url: product?.logo_url ?? null,
        product: product
          ? {
              id: product.id,
              slug: product.slug,
              name: product.name,
              logo_url: product.logo_url,
              category: product.category,
              description: product.description,
              tags: product.tags,
              website_url: product.website_url,
            }
          : null,
        source: row.source,
        source_url: row.source_url,
        source_id: row.source_id,
        event_type: row.event_type,
        title: row.title,
        body: row.body,
        author: row.author,
        engagement: row.engagement ?? {},
        detected_at: row.detected_at,
        event_at: row.event_at,
        confidence: row.confidence,
        // raw_data is service-role only per ADR; anon gets null
        raw_data: null,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('launch detail API unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
