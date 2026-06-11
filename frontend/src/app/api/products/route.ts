import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const pricing = searchParams.get('pricing') || '';
    const confidence = searchParams.get('confidence') || '';
    const sort = searchParams.get('sort') || 'recent';

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('availability_status', 'active');

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
      );
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (pricing) {
      query = query.eq('pricing_model', pricing);
    }
    if (confidence === 'high') {
      query = query.gte('confidence_score', 80);
    } else if (confidence === 'medium') {
      query = query.gte('confidence_score', 50).lt('confidence_score', 80);
    } else if (confidence === 'low') {
      query = query.gte('confidence_score', 20).lt('confidence_score', 50);
    }

    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'confidence') {
      query = query.order('confidence_score', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else if (sort === 'stars') {
      query = query.order('github_stars', { ascending: false, nullsFirst: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Products API error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
