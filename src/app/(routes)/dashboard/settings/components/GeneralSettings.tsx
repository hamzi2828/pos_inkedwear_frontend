'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GeneralSettingsProps {
  settings: any;
  onUpdate: (data: any) => void;
  isLoading?: boolean;
}

export default function GeneralSettings({ settings, onUpdate, isLoading }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    siteName: settings?.siteName || 'Inked Wear',
    siteUrl: settings?.siteUrl || 'https://inkedwear.com',
    posUrl: settings?.posUrl || '',
    currency: 'Rs',
  });

  // Sync form data when settings prop changes
  useEffect(() => {
    if (settings) {
      setFormData({
        siteName: settings.siteName || 'Inked Wear',
        siteUrl: settings.siteUrl || 'https://inkedwear.com',
        posUrl: settings.posUrl || '',
        currency: 'Rs',
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage your site's basic information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                placeholder="Enter site name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                type="url"
                value={formData.siteUrl}
                onChange={(e) => handleChange('siteUrl', e.target.value)}
                placeholder="https://your-site.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posUrl">External POS Link</Label>
              <Input
                id="posUrl"
                type="url"
                value={formData.posUrl}
                onChange={(e) => handleChange('posUrl', e.target.value)}
                placeholder="https://your-pos.vercel.app"
              />
              <p className="text-sm text-muted-foreground">Link to your POS system (optional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-muted-foreground">Currency is fixed to Rs (Rupees)</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}