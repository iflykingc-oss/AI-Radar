'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function CookieSettingsPage() {
  const [necessary, setNecessary] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Cookie Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Cookie Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="font-medium">Necessary Cookies</Label>
              <p className="text-sm text-muted-foreground">Required for authentication and security.</p>
            </div>
            <Switch checked={necessary} disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="font-medium">Analytics Cookies</Label>
              <p className="text-sm text-muted-foreground">Help us understand how visitors interact with our website.</p>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="font-medium">Marketing Cookies</Label>
              <p className="text-sm text-muted-foreground">Used to deliver relevant advertisements.</p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>
          <Separator />
          <div className="flex gap-4">
            <Button onClick={() => { setAnalytics(false); setMarketing(false); }}>
              Save Selection
            </Button>
            <Button variant="outline" onClick={() => { setAnalytics(true); setMarketing(true); }}>
              Accept All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
