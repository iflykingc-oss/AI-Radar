import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/newsletter/unsubscribe
 * Body: { email }
 *
 * Soft-deletes the subscription by setting unsubscribed_at = NOW().
 * Per ADR-04 R6, we never hard-delete (preserves audit trail). After this,
 * the partial unique index frees the email slot so a future resubscribe
 * can INSERT a new row.
 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

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

    const email: string | undefined = body?.email;
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { code: 4002, data: null, message: 'email is required' },
        { status: 400 }
      );
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json(
        { code: 4000, data: null, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Soft unsubscribe: only update rows that are not already unsubscribed.
    const nowIso = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('newsletter_subscriptions')
      .update({ unsubscribed_at: nowIso, confirmation_token: null })
      .eq('email', normalizedEmail)
      .is('unsubscribed_at', null)
      .select('id');

    if (error) {
      console.error('unsubscribe update error:', error);
      return NextResponse.json(
        { code: 5001, data: null, message: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Idempotent: even if no row matched (already unsubscribed or never
    // existed), we return success - the end state is the same.
    return NextResponse.json({
      code: 0,
      data: {
        unsubscribed: true,
        affected_rows: updated?.length ?? 0,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('unsubscribe unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
