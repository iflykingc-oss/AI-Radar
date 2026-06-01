'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Package, DollarSign, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const stats = [
  { label: 'Total Products', value: '10,234', change: '+127 this week', icon: Package, color: 'text-blue-500' },
  { label: 'Active Users', value: '1,456', change: '+89 this month', icon: Users, color: 'text-green-500' },
  { label: 'Revenue (MTD)', value: '$2,340', change: '+12% vs last month', icon: DollarSign, color: 'text-yellow-500' },
  { label: 'Push Success Rate', value: '99.2%', change: 'Last 24h', icon: TrendingUp, color: 'text-purple-500' },
];

const pendingReviews = [
  { id: 1, product: 'XYZ AI', type: 'Inaccurate', field: 'availability_status', suggestion: 'low_active', user: 'user_a' },
  { id: 2, product: 'ABC Tool', type: 'Outdated', field: 'pricing_model', suggestion: 'freemium', user: 'user_b' },
  { id: 3, product: 'DeepGenius', type: 'Wrong Category', field: 'category', suggestion: 'AI Agent', user: 'user_c' },
];

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reviews">
        <TabsList className="mb-4">
          <TabsTrigger value="reviews">Pending Reviews ({pendingReviews.length})</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="models">AI Model Config</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.product}</span>
                        <Badge variant="outline">{review.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Field: <code className="bg-muted px-1 rounded">{review.field}</code>
                        {' '}→ Suggested: <code className="bg-muted px-1 rounded">{review.suggestion}</code>
                      </p>
                      <p className="text-xs text-muted-foreground">Submitted by: {review.user}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-success">
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">User management table coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">AI Model configuration coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
