const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { getAuthHeader } from "@/helper/helper";

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'CNY' | 'PKR' | 'Rs';

// Tax Type Interface
interface TaxType {
  taxId?: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface SettingsData {
  siteName: string;
  storeName: string;
  taxRate: number;
  taxes: TaxType[];
  currency: CurrencyCode;
  siteUrl: string;
  posUrl: string;
  logoUrl: string;
  timezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  twoFactorAuth: boolean;
  isActive: boolean;
  version: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

class SettingsService {

  async getSettings(): Promise<SettingsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateSettings(updateData: Partial<SettingsData>): Promise<SettingsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/settings/logo`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload logo: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  async removeLogo(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/logo`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove logo: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<SettingsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
        method: 'POST',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const settingsService = new SettingsService();
export type { SettingsData, CurrencyCode, TaxType };
