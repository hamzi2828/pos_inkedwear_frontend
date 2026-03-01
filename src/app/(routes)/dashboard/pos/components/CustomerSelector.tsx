// Customer Selector Modal
'use client';

import { useState, useEffect } from 'react';
import { POSCustomer } from '../types';
import { Search, X, User } from 'lucide-react';
import { searchCustomers, getAllCustomers } from '../services/posCustomerService';

interface CustomerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: POSCustomer | null) => void;
  currentCustomer?: POSCustomer | null;
}

export default function CustomerSelector({
  isOpen,
  onClose,
  onSelect,
  currentCustomer,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadCustomers();
    }
  }, [searchQuery]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await searchCustomers(searchQuery);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: POSCustomer | null) => {
    onSelect(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Select Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Guest Option */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
              !currentCustomer
                ? 'border-[#dc2626] bg-red-50'
                : 'border-gray-200 hover:border-[#dc2626]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Walk-in Customer</div>
                <div className="text-sm text-gray-500">Guest checkout (no customer record)</div>
              </div>
            </div>
          </button>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]"></div>
              <p className="mt-2 text-gray-500">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No customers found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <button
                  key={customer._id}
                  onClick={() => handleSelect(customer)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    currentCustomer?._id === customer._id
                      ? 'border-[#dc2626] bg-red-50'
                      : 'border-gray-200 hover:border-[#dc2626]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#dc2626]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#dc2626] font-semibold text-lg">
                        {customer.firstName?.charAt(0) || 'C'}
                        {customer.lastName?.charAt(0) || ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {customer.phone && (
                          <span>{customer.phone}</span>
                        )}
                        {customer.email && (
                          <span className="truncate">{customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
