'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Youtube, Facebook, Instagram, Globe, Link2 } from 'lucide-react';
import { SettingsData } from '../services/settingsService';

interface SocialLinksProps {
  settings: SettingsData;
  onUpdate: (data: Partial<SettingsData>) => Promise<void>;
  isLoading: boolean;
}

interface SocialLinksData {
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
}

export default function SocialLinks({ settings, onUpdate, isLoading }: SocialLinksProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({
    youtubeUrl: '',
    facebookUrl: '',
    instagramUrl: '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setSocialLinks({
        youtubeUrl: (settings as any).youtubeUrl || '',
        facebookUrl: (settings as any).facebookUrl || '',
        instagramUrl: (settings as any).instagramUrl || '',
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof SocialLinksData, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(socialLinks);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving social links:', error);
    }
  };

  const handleReset = () => {
    setSocialLinks({
      youtubeUrl: (settings as any).youtubeUrl || '',
      facebookUrl: (settings as any).facebookUrl || '',
      instagramUrl: (settings as any).instagramUrl || '',
    });
    setHasChanges(false);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getUrlPlaceholder = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'https://youtube.com/@yourchannel';
      case 'facebook':
        return 'https://facebook.com/yourpage';
      case 'instagram':
        return 'https://instagram.com/youraccount';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Social Media Links
        </CardTitle>
        <CardDescription>
          Add your social media profiles to display on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              YouTube Channel
            </Label>
            <Input
              id="youtube"
              type="url"
              placeholder={getUrlPlaceholder('youtube')}
              value={socialLinks.youtubeUrl}
              onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
              className={!validateUrl(socialLinks.youtubeUrl) ? 'border-red-500' : ''}
            />
            {socialLinks.youtubeUrl && !validateUrl(socialLinks.youtubeUrl) && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook Page
            </Label>
            <Input
              id="facebook"
              type="url"
              placeholder={getUrlPlaceholder('facebook')}
              value={socialLinks.facebookUrl}
              onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
              className={!validateUrl(socialLinks.facebookUrl) ? 'border-red-500' : ''}
            />
            {socialLinks.facebookUrl && !validateUrl(socialLinks.facebookUrl) && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram Profile
            </Label>
            <Input
              id="instagram"
              type="url"
              placeholder={getUrlPlaceholder('instagram')}
              value={socialLinks.instagramUrl}
              onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
              className={!validateUrl(socialLinks.instagramUrl) ? 'border-red-500' : ''}
            />
            {socialLinks.instagramUrl && !validateUrl(socialLinks.instagramUrl) && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Preview
          </h4>
          <div className="flex gap-4">
            {socialLinks.youtubeUrl && validateUrl(socialLinks.youtubeUrl) && (
              <div className="flex items-center gap-2 text-sm">
                <Youtube className="h-4 w-4 text-red-600" />
                YouTube
              </div>
            )}
            {socialLinks.facebookUrl && validateUrl(socialLinks.facebookUrl) && (
              <div className="flex items-center gap-2 text-sm">
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </div>
            )}
            {socialLinks.instagramUrl && validateUrl(socialLinks.instagramUrl) && (
              <div className="flex items-center gap-2 text-sm">
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram
              </div>
            )}
            {!socialLinks.youtubeUrl && !socialLinks.facebookUrl && !socialLinks.instagramUrl && (
              <p className="text-sm text-muted-foreground">No social links configured</p>
            )}
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading ||
                !validateUrl(socialLinks.youtubeUrl) ||
                !validateUrl(socialLinks.facebookUrl) ||
                !validateUrl(socialLinks.instagramUrl)
              }
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}