'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LucideIcon, MessageSquare, Send, Hash, Bell, Users, Workflow } from 'lucide-react';

// Channel configuration definitions
interface ChannelField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface ChannelDef {
  id: string;
  name: string;
  icon: LucideIcon;
  fields: ChannelField[];
  hasTestButton: boolean;
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'feishu',
    name: 'Feishu',
    icon: MessageSquare,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...' },
      { key: 'bot_name', label: 'Bot Name', placeholder: 'AI Radar Bot' },
    ],
    hasTestButton: true,
  },
  {
    id: 'dingtalk',
    name: 'DingTalk',
    icon: Bell,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'SEC...', type: 'password' },
    ],
    hasTestButton: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: Hash,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/T00.../B00.../...' },
      { key: 'channel', label: 'Channel', placeholder: '#ai-alerts' },
    ],
    hasTestButton: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF...', type: 'password' },
      { key: 'chat_id', label: 'Chat ID', placeholder: '-1001234567890' },
    ],
    hasTestButton: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Users,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' },
    ],
    hasTestButton: true,
  },
  {
    id: 'teams',
    name: 'Teams',
    icon: Workflow,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://outlook.office.com/webhook/...' },
    ],
    hasTestButton: true,
  },
];

interface ChannelState {
  enabled: boolean;
  config: Record<string, string>;
}

interface PushChannelData {
  channel_type: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface ProfileForm {
  fullName: string;
  email: string;
  company: string;
  website: string;
}

interface NotificationSettings {
  newProductAlerts: boolean;
  statusChanges: boolean;
  weeklySummary: boolean;
  opportunityAlerts: boolean;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const t = useTranslations('settings');

  // --- Profile state ---
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: '',
    email: '',
    company: '',
    website: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- Notification settings state ---
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newProductAlerts: false,
    statusChanges: false,
    weeklySummary: false,
    opportunityAlerts: false,
  });

  // --- Preferences state ---
  const [language, setLanguage] = useState('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // --- Push channels state (existing) ---
  const [channels, setChannels] = useState<Record<string, ChannelState>>(
    Object.fromEntries(
      CHANNELS.map((ch) => [
        ch.id,
        {
          enabled: false,
          config: Object.fromEntries(ch.fields.map((f) => [f.key, ''])),
        },
      ])
    )
  );

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>(
    Object.fromEntries(CHANNELS.map((ch) => [ch.id, 'idle']))
  );

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('ai-radar-profile');
    if (savedProfile) {
      try {
        setProfileForm(JSON.parse(savedProfile));
      } catch {
        // ignore parse errors
      }
    }

    const savedNotifications = localStorage.getItem('ai-radar-notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        // ignore parse errors
      }
    }

    const savedLocale = document.cookie.split('; ').find((row) => row.startsWith('NEXT_LOCALE='));
    if (savedLocale) {
      setLanguage(savedLocale.split('=')[1]);
    }

    const savedInterests = localStorage.getItem('ai-radar-interests');
    if (savedInterests) {
      try {
        setSelectedInterests(JSON.parse(savedInterests));
      } catch {
        // ignore parse errors
      }
    }

    const savedCategories = localStorage.getItem('ai-radar-categories');
    if (savedCategories) {
      try {
        setSelectedCategories(JSON.parse(savedCategories));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // --- Profile handlers ---
  const handleProfileChange = useCallback((field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProfileSave = useCallback(async () => {
    setProfileSaving(true);
    setProfileSaveStatus('idle');
    try {
      localStorage.setItem('ai-radar-profile', JSON.stringify(profileForm));
      setProfileSaveStatus('success');
      setTimeout(() => setProfileSaveStatus('idle'), 3000);
    } catch {
      setProfileSaveStatus('error');
      setTimeout(() => setProfileSaveStatus('idle'), 3000);
    } finally {
      setProfileSaving(false);
    }
  }, [profileForm]);

  // --- Notification handlers (auto-save on toggle) ---
  const handleNotificationToggle = useCallback((key: keyof NotificationSettings, checked: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: checked };
      localStorage.setItem('ai-radar-notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- Preference handlers ---
  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value);
    document.cookie = `NEXT_LOCALE=${value};path=/;max-age=31536000`;
    window.location.reload();
  }, []);

  const toggleInterest = useCallback((tag: string) => {
    setSelectedInterests((prev) => {
      const updated = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      localStorage.setItem('ai-radar-interests', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category];
      localStorage.setItem('ai-radar-categories', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- Security handlers ---
  const handleChangePassword = useCallback(() => {
    alert('Change Password — Coming soon');
  }, []);

  const handleDeleteAccount = useCallback(() => {
    if (confirm('Delete Account — This feature is coming soon. Are you sure you want to continue?')) {
      alert('Delete Account — Coming soon');
    }
  }, []);

  // --- Push channels handlers (existing) ---
  const handleToggle = useCallback((channelId: string, enabled: boolean) => {
    setChannels((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], enabled },
    }));
  }, []);

  const handleFieldChange = useCallback((channelId: string, fieldKey: string, value: string) => {
    setChannels((prev) => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        config: { ...prev[channelId].config, [fieldKey]: value },
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const payload: PushChannelData[] = CHANNELS.map((ch) => ({
        channel_type: ch.id,
        enabled: channels[ch.id]?.enabled ?? false,
        config: channels[ch.id]?.config ?? {},
      }));

      const response = await fetch('/api/settings/push-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: payload }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save push channels error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [channels]);

  const handleTest = useCallback(async (channelId: string) => {
    setTestStatus((prev) => ({ ...prev, [channelId]: 'loading' }));
    try {
      const channelState = channels[channelId];
      const channelDef = CHANNELS.find((c) => c.id === channelId)!;
      const webhookField = channelDef.fields.find((f) => f.key === 'webhook_url');

      if (webhookField && channelState.config[webhookField.key] && !isValidUrl(channelState.config[webhookField.key])) {
        setTestStatus((prev) => ({ ...prev, [channelId]: 'error' }));
        setTimeout(() => setTestStatus((prev) => ({ ...prev, [channelId]: 'idle' })), 3000);
        return;
      }

      const response = await fetch(`/api/settings/push-channels/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: channelId,
          config: channelState.config,
        }),
      });

      if (response.ok) {
        setTestStatus((prev) => ({ ...prev, [channelId]: 'success' }));
      } else {
        setTestStatus((prev) => ({ ...prev, [channelId]: 'error' }));
      }
      setTimeout(() => setTestStatus((prev) => ({ ...prev, [channelId]: 'idle' })), 3000);
    } catch (err) {
      console.error('Test channel error:', err);
      setTestStatus((prev) => ({ ...prev, [channelId]: 'error' }));
      setTimeout(() => setTestStatus((prev) => ({ ...prev, [channelId]: 'idle' })), 3000);
    }
  }, [channels]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Your name"
                value={profileForm.fullName}
                onChange={(e) => handleProfileChange('fullName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={profileForm.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Your company"
                value={profileForm.company}
                onChange={(e) => handleProfileChange('company', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={profileForm.website}
                onChange={(e) => handleProfileChange('website', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {profileSaveStatus === 'success' && (
                <span className="text-sm text-green-600">Saved successfully!</span>
              )}
              {profileSaveStatus === 'error' && (
                <span className="text-sm text-red-600">Save failed. Please try again.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'newProductAlerts' as const, label: 'New product alerts', desc: 'Get notified when new products match your interests' },
              { key: 'statusChanges' as const, label: 'Status changes', desc: 'Get notified when tracked products change status' },
              { key: 'weeklySummary' as const, label: 'Weekly summary', desc: 'Receive a weekly digest of AI industry trends' },
              { key: 'opportunityAlerts' as const, label: 'Opportunity alerts', desc: 'Get notified about high-potential startup opportunities' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Push Channels */}
        <Card>
          <CardHeader>
            <CardTitle>{t('push_channels_title')}</CardTitle>
            <CardDescription>{t('push_channels_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const state = channels[channel.id];
              const isTesting = testStatus[channel.id] === 'loading';
              const testSuccess = testStatus[channel.id] === 'success';
              const testError = testStatus[channel.id] === 'error';

              return (
                <div key={channel.id} className="rounded-lg border p-4 space-y-4">
                  {/* Channel header with toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{t(`channel_${channel.id}`)}</p>
                        <p className="text-xs text-muted-foreground">{t(`channel_${channel.id}_desc`)}</p>
                      </div>
                    </div>
                    <Switch
                      checked={state.enabled}
                      onCheckedChange={(checked) => handleToggle(channel.id, checked)}
                    />
                  </div>

                  {/* Config fields (shown when enabled) */}
                  {state.enabled && (
                    <div className="space-y-3 pl-12">
                      {channel.fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <Label htmlFor={`${channel.id}-${field.key}`} className="text-sm">
                            {field.label}
                          </Label>
                          <Input
                            id={`${channel.id}-${field.key}`}
                            type={field.type || 'url'}
                            placeholder={field.placeholder}
                            value={state.config[field.key] || ''}
                            onChange={(e) => handleFieldChange(channel.id, field.key, e.target.value)}
                          />
                        </div>
                      ))}

                      {/* Test button */}
                      {channel.hasTestButton && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isTesting}
                            onClick={() => handleTest(channel.id)}
                            className={
                              testSuccess
                                ? 'border-green-500 text-green-600'
                                : testError
                                ? 'border-red-500 text-red-600'
                                : ''
                            }
                          >
                            {isTesting
                              ? t('test_sending')
                              : testSuccess
                              ? t('test_success')
                              : testError
                              ? t('test_failed')
                              : t('test_connection')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Save button */}
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {saveStatus === 'success' && (
                  <span className="text-green-600">{t('save_success')}</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600">{t('save_error')}</span>
                )}
              </p>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('saving') : t('save_channels')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Interest Tags</Label>
              <p className="text-sm text-muted-foreground">Select 3-5 areas you care about</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['AI Writing', 'AI Coding', 'AI Agent', 'AI Design', 'AI Video', 'AI Infrastructure', 'AI Model', 'AI API'].map((tag) => (
                  <span
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm cursor-pointer transition-colors ${
                      selectedInterests.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Product Categories</Label>
              <p className="text-sm text-muted-foreground">Select categories you want to track</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['LLM', 'Agent', 'RPA', 'Computer Vision', 'NLP', 'Speech', 'Robotics', 'AI Chip', 'AutoML', 'AI Security'].map((category) => (
                  <span
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm cursor-pointer transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleChangePassword}>Change Password</Button>
            <Separator />
            <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
