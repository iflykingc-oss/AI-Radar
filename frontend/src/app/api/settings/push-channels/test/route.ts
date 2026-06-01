import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel_type, config } = body as {
      channel_type: string;
      config: Record<string, string>;
    };

    if (!channel_type || !config) {
      return NextResponse.json(
        { error: 'Missing channel_type or config' },
        { status: 400 }
      );
    }

    const webhookUrl =
      config.webhook_url ||
      (channel_type === 'telegram'
        ? `https://api.telegram.org/bot${config.bot_token}/sendMessage`
        : '');

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    const testMessage = {
      text: '🔔 AI Radar Test Message: Your push channel is configured correctly!',
    };

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (channel_type === 'dingtalk' && config.secret_key) {
      headers['X-DingTalk-Signature'] = config.secret_key;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testMessage),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Test message sent successfully' });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Test failed with status ${response.status}`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Push channel test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test message. Please check your configuration.',
      },
      { status: 500 }
    );
  }
}
