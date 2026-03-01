'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PlusCircle,
  Kanban,
  Check,
  X,
} from 'lucide-react';
import { POSCustomer, POSTax } from '../../types';
import DTFOrderForm from './DTFOrderForm';
import DTFStatusTracker from './DTFStatusTracker';
import CustomerSelector from '../../components/CustomerSelector';
import { getAuthHeader } from '@/helper/helper';

type DTFTab = 'new-order' | 'production';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DTFOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL or default to 'new-order'
  const tabFromUrl = searchParams.get('tab') as DTFTab | null;
  const validTabs: DTFTab[] = ['new-order', 'production'];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'new-order';

  const [activeTab, setActiveTab] = useState<DTFTab>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: DTFTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/dashboard/pos/dtf?${params.toString()}`, { scroll: false });
  };

  const [customer, setCustomer] = useState<POSCustomer | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('PKR');

  // Tax state
  const [availableTaxes, setAvailableTaxes] = useState<POSTax[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  // Load settings for currency and taxes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
          headers: getAuthHeader(),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.currency) {
            setCurrency(data.data.currency);
          }
          // Load taxes
          if (data.data?.taxes && Array.isArray(data.data.taxes)) {
            const activeTaxes: POSTax[] = data.data.taxes
              .filter((t: POSTax) => t.isActive)
              .map((t: POSTax) => ({
                taxId: t.taxId || '',
                name: t.name,
                rate: t.rate,
                description: t.description,
                isActive: t.isActive,
                isDefault: t.isDefault,
              }));
            setAvailableTaxes(activeTaxes);
            // Auto-select default tax
            const defaultTax = activeTaxes.find((t: POSTax) => t.isDefault);
            if (defaultTax) {
              setSelectedTaxIds([defaultTax.taxId]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleOrderCreated = (orderNumber: string) => {
    setSuccessMessage(`Order ${orderNumber} created successfully! View in POS > Today's Sales`);
    setCustomer(null);
    setTimeout(() => setSuccessMessage(null), 5000);

    // Switch to production tab
    handleTabChange('production');
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="h-5 w-5 text-green-600" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DTF Orders</h1>
          <p className="text-gray-500">Direct-to-Film Printing Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => handleTabChange('new-order')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'new-order'
                ? 'border-[#dc2626] text-[#dc2626]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusCircle className="h-4 w-4 inline mr-2" />
            New Order
          </button>
          <button
            onClick={() => handleTabChange('production')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'production'
                ? 'border-[#dc2626] text-[#dc2626]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Kanban className="h-4 w-4 inline mr-2" />
            Production Queue
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'new-order' && (
        <DTFOrderForm
          customer={customer}
          onOrderCreated={handleOrderCreated}
          onSelectCustomer={() => setShowCustomerSelector(true)}
          currency={currency}
          availableTaxes={availableTaxes}
          selectedTaxIds={selectedTaxIds}
          onTaxSelectionChange={setSelectedTaxIds}
        />
      )}

      {activeTab === 'production' && <DTFStatusTracker />}

      {/* Customer Selector Modal */}
      <CustomerSelector
        isOpen={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        onSelect={(c) => {
          setCustomer(c);
          setShowCustomerSelector(false);
        }}
        currentCustomer={customer}
      />
    </div>
  );
}
