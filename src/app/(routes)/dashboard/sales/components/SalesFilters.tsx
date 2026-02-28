// Sales Filters Component
'use client';

import { Search } from 'lucide-react';
import { DateFilterType } from '../types';

interface VendorOption {
  _id: string;
  name: string;
}

interface SalesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (value: DateFilterType) => void;
  customStartDate: string;
  onCustomStartDateChange: (value: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  vendorFilter?: string;
  onVendorFilterChange?: (value: string) => void;
  vendors?: VendorOption[];
}

export default function SalesFilters({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  paymentFilter,
  onPaymentFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  vendorFilter = 'all',
  onVendorFilterChange,
  vendors = [],
}: SalesFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, customer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as DateFilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomStartDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomEndDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Payment Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Vendor Filter */}
        {onVendorFilterChange && vendors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              value={vendorFilter}
              onChange={(e) => onVendorFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Status Filter */}
        {onStatusFilterChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}

      </div>
    </div>
  );
}
