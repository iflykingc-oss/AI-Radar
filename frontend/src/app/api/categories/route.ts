export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getFallbackCategories, withSupabaseFallbackTimeout } from '@/lib/api/fallback-data';

/**
 * GET /api/categories
 * Returns the category tree.
 *
 * Query params (all optional):
 *   - parent_id: UUID, fetch children of this category; omit to fetch all
 *   - include_empty: 'true' | 'false' (default false)
 *   - order_by: 'display_order' | 'hot_score' | 'product_count' (default 'display_order')
 *   - lang: 'en' | 'zh' (default 'en') -> selects which name_* field to use
 *
 * Response: { code, data: { items: CategoryNode[], total }, message }
 *   CategoryNode = { id, slug, name, name_en, name_zh, description, parent_id,
 *                    product_count, hot_score, display_order, icon, children: CategoryNode[] }
 */
const VALID_ORDER = new Set(['display_order', 'hot_score', 'product_count']);
const VALID_LANG = new Set(['en', 'zh']);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parentId = searchParams.get('parent_id');
    const includeEmpty = searchParams.get('include_empty') === 'true';
    const orderBy = searchParams.get('order_by') || 'display_order';
    const lang = searchParams.get('lang') || 'en';

    if (!VALID_ORDER.has(orderBy)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid order_by: ${orderBy}` },
        { status: 400 }
      );
    }
    if (!VALID_LANG.has(lang)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid lang: ${lang}` },
        { status: 400 }
      );
    }

    let query = supabase
      .from('categories')
      .select('id, slug, name_en, name_zh, description, parent_id, product_count, hot_score, display_order, icon')
      .order(orderBy, { ascending: false });
    // secondary order by display_order to make output stable
    query = query.order('display_order', { ascending: true });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }
    if (!includeEmpty) {
      query = query.gt('product_count', 0);
    }

    const { data: rows, error } = await withSupabaseFallbackTimeout(query, 'categories query');
    if (error) {
      console.warn('categories API fallback activated:', error.message ?? error);
      return NextResponse.json({
        code: 0,
        data: getFallbackCategories({
          parentId,
          includeEmpty,
          orderBy: orderBy as 'display_order' | 'hot_score' | 'product_count',
          lang: lang as 'en' | 'zh',
        }),
        message: 'ok',
      });
    }

    // Build a tree: roots (parent_id null) and children
    const all = (rows || []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      name_en: r.name_en,
      name_zh: r.name_zh,
      name: lang === 'zh' && r.name_zh ? r.name_zh : r.name_en,
      description: r.description,
      parent_id: r.parent_id,
      product_count: r.product_count ?? 0,
      hot_score: r.hot_score ?? 0,
      display_order: r.display_order ?? 0,
      icon: r.icon,
    }));

    // If parent_id was specified, return flat list (those are the children
    // of that parent). Otherwise, assemble a 2-level tree.
    if (parentId) {
      return NextResponse.json({
        code: 0,
        data: { items: all.map((c) => ({ ...c, children: [] })), total: all.length },
        message: 'ok',
      });
    }

    const byParent = new Map<string | null, any[]>();
    for (const c of all) {
      const key = c.parent_id ?? null;
      const list = byParent.get(key) ?? [];
      list.push(c);
      byParent.set(key, list);
    }
    const assemble = (parentKey: string | null): any[] => {
      const children = byParent.get(parentKey) ?? [];
      return children.map((c) => ({
        ...c,
        children: assemble(c.id),
      }));
    };
    const tree = assemble(null);

    return NextResponse.json({
      code: 0,
      data: { items: tree, total: all.length },
      message: 'ok',
    });
  } catch (error) {
    console.error('categories API unexpected error:', error);
    return NextResponse.json({
      code: 0,
      data: getFallbackCategories({
        includeEmpty: true,
        orderBy: 'display_order',
      }),
      message: 'ok',
    });
  }
}
