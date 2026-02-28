'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, Bell, Image as ImageIcon, Link2, Receipt } from 'lucide-react';

import GeneralSettings from './components/GeneralSettings';
import NotificationSettings from './components/NotificationSettings';
import LogoUpload from './components/LogoUpload';
import SocialLinks from './components/SocialLinks';
import TaxSettings from './components/TaxSettings';
import { settingsService, SettingsData } from './services/settingsService';


export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updateData: Partial<SettingsData>) => {
    try {
      setIsLoading(true);
      const data = await settingsService.updateSettings(updateData);
      setSettings(data);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      setIsLoading(true);
      const data = await settingsService.uploadLogo(file);
      setSettings(prev => prev ? { ...prev, logoUrl: data.logoUrl } : null);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = async () => {
    try {
      setIsLoading(true);
      await settingsService.removeLogo();
      setSettings(prev => prev ? { ...prev, logoUrl: '' } : null);
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await settingsService.resetSettings();
      setSettings(data);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-destructive border border-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
            disabled={isLoading}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tax
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            settings={settings}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="logo">
          <LogoUpload
            currentLogo={settings.logoUrl}
            onUpload={uploadLogo}
            onRemove={removeLogo}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="social">
          <SocialLinks
            settings={settings}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            settings={settings}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="tax">
          <TaxSettings
            settings={settings}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}