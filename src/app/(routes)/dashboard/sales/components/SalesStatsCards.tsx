// Sales Stats Cards Component
'use client';

import { SalesStats } from '../types';
import { getCurrencySymbol } from '@/helper/helper';

interface SalesStatsCardsProps {
  stats: SalesStats;
  loading?: boolean;
  currency?: string;
  expenses?: number;
  productCost?: number;
  showFinancials?: boolean; // Show expenses, product cost, and profit
}

export default function SalesStatsCards({
  stats,
  loading,
  currency = 'PKR',
  expenses = 0,
  productCost = 0,
  showFinancials = false
}: SalesStatsCardsProps) {
  const symbol = getCurrencySymbol(currency);
  const profit = stats.totalSales - expenses - productCost;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${showFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4`}>
        {[...Array(showFinancials ? 4 : 5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-28"></div>
          </div>
        ))}
      </div>
    );
  }

  // Original layout for sales page (without financials)
  if (!showFinancials) {
    const hasPending = (stats.pendingOrders || 0) > 0;
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${hasPending ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-2xl font-bold text-gray-900">{symbol}{stats.totalSales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          {stats.totalOrders > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Avg: {symbol}{stats.averageOrderValue.toFixed(2)}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Cash Sales</div>
          <div className="text-2xl font-bold text-green-600">{symbol}{stats.cashSales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Card Sales</div>
          <div className="text-2xl font-bold text-blue-600">{symbol}{stats.cardSales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Bank Transfer</div>
          <div className="text-2xl font-bold text-orange-600">{symbol}{stats.bankSales.toFixed(2)}</div>
        </div>
        {hasPending && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="text-sm text-red-600">Pending Payments</div>
            <div className="text-2xl font-bold text-red-600">{symbol}{(stats.pendingAmount || 0).toFixed(2)}</div>
            <div className="text-xs text-red-500 mt-1">
              {stats.pendingOrders} order(s)
            </div>
          </div>
        )}
      </div>
    );
  }

  // Financial layout for reporting page (with expenses, cost, profit)
  const hasPending = (stats.pendingOrders || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payment Breakdown Box - All payment methods in one */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Sales by Payment</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Cash Sales</span>
              <span className="text-base font-semibold text-green-600">{symbol}{stats.cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Card Sales</span>
              <span className="text-base font-semibold text-blue-600">{symbol}{stats.cardSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Bank Transfer</span>
              <span className="text-base font-semibold text-orange-600">{symbol}{stats.bankSales.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Sales</span>
              <span className="text-lg font-bold text-gray-900">{symbol}{stats.totalSales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Box */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Expenses</div>
          <div className="text-2xl font-bold text-red-600">{symbol}{expenses.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">Based on date range</div>
        </div>

        {/* Product Cost Box */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Product Cost</div>
          <div className="text-2xl font-bold text-orange-600">{symbol}{productCost.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">Cost of items sold</div>
        </div>

        {/* Profit Box */}
        <div className={`bg-white rounded-lg border p-4 ${profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="text-sm text-gray-500">Profit</div>
          <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {symbol}{profit.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Sales - Expenses - Cost</div>
        </div>
      </div>

      {/* Pending Payments Alert - Only show if there are pending payments */}
      {hasPending && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-800">Pending Payments</div>
              <div className="text-2xl font-bold text-red-600">{symbol}{(stats.pendingAmount || 0).toFixed(2)}</div>
              <div className="text-xs text-red-500 mt-1">{stats.pendingOrders} order(s) with outstanding balance</div>
            </div>
            <a
              href="/dashboard/pos?tab=pending"
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              View Pending
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
