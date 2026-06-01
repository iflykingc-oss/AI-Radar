import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: channels, error } = await supabase
      .from('push_channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (channels || []).map((ch) => ({
      channel_type: ch.channel_type,
      enabled: ch.is_active,
      config: {
        webhook_url: ch.webhook_url || '',
        webhook_secret: ch.webhook_secret || '',
        bot_name: '',
        secret_key: '',
        channel: '',
        bot_token: '',
        chat_id: '',
        push_frequency: ch.push_frequency || 'daily',
        push_time: ch.push_time || '',
      },
      notify: {
        new_products: ch.notify_new_products,
        status_change: ch.notify_status_change,
        test_failure: ch.notify_test_failure,
        weekly_report: ch.notify_weekly_report,
        opportunity_alert: ch.notify_opportunity_alert,
      },
    }));

    return NextResponse.json({ channels: formatted });
  } catch (error) {
    console.error('Push channels GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channels } = body as {
      channels: Array<{
        channel_type: string;
        enabled: boolean;
        config: Record<string, string>;
      }>;
    };

    if (!channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'Invalid request body: channels array required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      channels.map(async (channel) => {
        const { channel_type, enabled, config } = channel;

        const { error } = await supabase
          .from('push_channels')
          .upsert(
            {
              channel_type,
              is_active: enabled,
              webhook_url: config.webhook_url || '',
              webhook_secret:
                config.webhook_secret || config.secret_key || null,
              notify_new_products: true,
              notify_status_change: true,
              notify_test_failure: true,
              notify_weekly_report: true,
              notify_opportunity_alert: true,
              push_frequency: config.push_frequency || 'daily',
              push_time: config.push_time || null,
            },
            {
              onConflict: 'channel_type',
            }
          );

        return { channel_type, success: !error, error: error?.message };
      })
    );

    const hasErrors = results.some((r) => r.error);

    return NextResponse.json({
      success: !hasErrors,
      results,
    });
  } catch (error) {
    console.error('Push channels POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
