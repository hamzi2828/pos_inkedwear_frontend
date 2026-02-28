'use client';

import { useState, useEffect } from 'react';
import { SettingsData } from '../services/settingsService';
import { Store, Percent } from 'lucide-react';

interface POSSettingsProps {
  settings: SettingsData;
  onUpdate: (data: Partial<SettingsData>) => Promise<void>;
  isLoading: boolean;
}

export default function POSSettings({ settings, onUpdate, isLoading }: POSSettingsProps) {
  const [storeName, setStoreName] = useState(settings.storeName || 'POS STORE');
  const [taxRate, setTaxRate] = useState(settings.taxRate ?? 0.08);

  useEffect(() => {
    setStoreName(settings.storeName || 'POS STORE');
    setTaxRate(settings.taxRate ?? 0.08);
  }, [settings]);

  const handleSaveStoreSettings = async () => {
    await onUpdate({ storeName, taxRate });
  };

  return (
    <div className="space-y-6">
      {/* Store Name Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-[#dc2626]" />
          <h3 className="text-lg font-semibold">Store Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name (shown on receipts)
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                placeholder="Enter store name"
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will appear on all POS receipts and invoices
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Percent className="h-4 w-4 inline mr-1" />
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(taxRate * 100).toFixed(1)}
                onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                placeholder="Enter tax rate"
              />
              <p className="text-sm text-gray-500 mt-1">
                Tax applied to all POS retail sales (Current: {(taxRate * 100).toFixed(1)}%)
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveStoreSettings}
            disabled={isLoading}
            className="px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Store Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
