export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET  /api/newsletter/confirm?token=xxx  -> primary entry (from email link)
 * POST /api/newsletter/confirm  { token } -> API clients
 *
 * Looks up the subscription by confirmation_token, marks it active by
 * setting confirmed_at = NOW() and clearing the token (one-time use).
 */
async function confirmByToken(token: string) {
  if (!token || typeof token !== 'string') {
    return {
      ok: false as const,
      status: 400,
      body: { code: 4000, data: null, message: 'token is required' },
    };
  }

  const { data: sub, error: lookupErr } = await supabase
    .from('newsletter_subscriptions')
    .select('id, email, frequency, confirmation_token, confirmed_at, unsubscribed_at')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (lookupErr) {
    console.error('confirm lookup error:', lookupErr);
    return {
      ok: false as const,
      status: 500,
      body: { code: 5001, data: null, message: 'Failed to lookup token' },
    };
  }

  if (!sub) {
    return {
      ok: false as const,
      status: 404,
      body: { code: 4003, data: null, message: 'confirmation token not found or already used' },
    };
  }

  if (sub.unsubscribed_at) {
    return {
      ok: false as const,
      status: 400,
      body: { code: 4003, data: null, message: 'subscription is unsubscribed' },
    };
  }

  if (sub.confirmed_at) {
    // Idempotent: token consumed but subscription already active.
    return {
      ok: true as const,
      status: 200,
      body: {
        code: 0,
        data: {
          subscription_id: sub.id,
          email: sub.email,
          frequency: sub.frequency,
          confirmed_at: sub.confirmed_at,
        },
        message: 'Subscription already confirmed',
      },
    };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from('newsletter_subscriptions')
    .update({ confirmed_at: nowIso, confirmation_token: null })
    .eq('id', sub.id)
    .select('id, email, frequency, confirmed_at')
    .single();

  if (updateErr) {
    console.error('confirm update error:', updateErr);
    return {
      ok: false as const,
      status: 500,
      body: { code: 5001, data: null, message: 'Failed to confirm subscription' },
    };
  }

  // TODO: trigger push-worker "welcome email" send (mock)
  console.log('[MOCK EMAIL] Welcome email to:', updated.email);

  return {
    ok: true as const,
    status: 200,
    body: {
      code: 0,
      data: {
        subscription_id: updated.id,
        email: updated.email,
        frequency: updated.frequency,
        confirmed_at: updated.confirmed_at,
      },
      message: 'Subscription confirmed',
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || '';
    const result = await confirmByToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('confirm GET unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: 4001, data: null, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    const token: string = body?.token ?? '';
    const result = await confirmByToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('confirm POST unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
