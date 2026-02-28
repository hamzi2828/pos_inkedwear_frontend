"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FiTrendingUp, FiPackage, FiDollarSign,
  FiClock, FiShoppingCart, FiCreditCard,
  FiRefreshCw, FiCalendar, FiMinusCircle,
  FiPocket
} from 'react-icons/fi';
import { StatsCard } from './adminComponents/StatsCard';
import { QuickStats } from './adminComponents/QuickStats';
import { SalesTrendChart } from './adminComponents/SalesTrendChart';
import {
  getDashboardStats,
  getSalesChart,
  type DashboardStats,
  type SalesChartData,
  type FilterType
} from '@/app/(routes)/dashboard/pos/services/posDashboardService';
import { getCurrencySymbol } from '@/helper/helper';
import { settingsService } from './settings/services/settingsService';
import { expenseService } from './expenses/service/expenseService';

interface ExpenseSummary {
  totalExpenses: number;
  count: number;
  cashExpenses: number;
}

const AdminDashboardClient = () => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<SalesChartData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseSummary>({ totalExpenses: 0, count: 0, cashExpenses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<FilterType>('today');
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '12months'>('7days');
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState<string>('USD');

  // Load settings for currency
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.currency) {
          setCurrency(settings.currency);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      // Calculate date range based on timeRange
      const now = new Date();
      let startDate: string;
      let endDate: string = now.toISOString().split('T')[0];

      if (timeRange === 'today') {
        startDate = endDate;
      } else if (timeRange === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const [stats, chart, expenses] = await Promise.all([
        getDashboardStats({ filter: timeRange }),
        getSalesChart(chartPeriod),
        expenseService.getExpenseSummary(startDate, endDate).catch(() => ({ totalExpenses: 0, count: 0, byPaymentMethod: [] }))
      ]);

      // Calculate cash expenses from the expense summary
      let cashExpenses = 0;
      if (expenses?.byPaymentMethod && Array.isArray(expenses.byPaymentMethod)) {
        const cashMethod = expenses.byPaymentMethod.find(
          (pm: { _id: string; totalAmount: number }) => pm._id?.toLowerCase() === 'cash'
        );
        cashExpenses = cashMethod?.totalAmount || 0;
      }

      setDashboardData(stats);
      setChartData(chart);
      setExpenseData({
        totalExpenses: expenses?.totalExpenses || 0,
        count: expenses?.count || 0,
        cashExpenses
      });
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, chartPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const getChangeType = (change: string): 'increase' | 'decrease' => {
    const num = parseFloat(change);
    return num >= 0 ? 'increase' : 'decrease';
  };

  const currencySymbol = getCurrencySymbol(currency);

  // Calculate cash in hand (Total Sales - Total Expenses)
  const cashInHand = dashboardData.period.totalSales - expenseData.totalExpenses;

  const statsConfig = [
    {
      name: 'Total Sales',
      value: dashboardData.period.totalSales.toFixed(2),
      icon: FiDollarSign,
      change: `${dashboardData.period.salesChange}%`,
      changeType: getChangeType(dashboardData.period.salesChange),
      prefix: currencySymbol
    },
    {
      name: 'Total Expenses',
      value: expenseData.totalExpenses.toFixed(2),
      icon: FiMinusCircle,
      change: `${expenseData.count} expenses`,
      changeType: 'decrease' as const,
      prefix: currencySymbol
    },
    {
      name: 'Cash in Hand',
      value: cashInHand.toFixed(2),
      icon: FiPocket,
      change: cashInHand >= 0 ? 'Positive' : 'Negative',
      changeType: cashInHand >= 0 ? 'increase' as const : 'decrease' as const,
      prefix: currencySymbol
    },
    {
      name: 'Total Orders',
      value: dashboardData.period.totalOrders.toLocaleString(),
      icon: FiShoppingCart,
      change: `${dashboardData.period.ordersChange}%`,
      changeType: getChangeType(dashboardData.period.ordersChange),
      prefix: ''
    },
    {
      name: 'Cash Sales',
      value: dashboardData.period.cashSales.toFixed(2),
      icon: FiDollarSign,
      change: '+0%',
      changeType: 'increase' as const,
      prefix: currencySymbol
    },
    {
      name: 'Card Sales',
      value: dashboardData.period.cardSales.toFixed(2),
      icon: FiCreditCard,
      change: '+0%',
      changeType: 'increase' as const,
      prefix: currencySymbol
    },
  ];

  const quickStatsConfig = [
    {
      name: 'Period',
      value: dashboardData.periodLabel,
      icon: FiCalendar,
      color: 'text-blue-500 bg-blue-100'
    },
    {
      name: 'Items Sold',
      value: dashboardData.period.totalItems.toString(),
      icon: FiPackage,
      color: 'text-purple-500 bg-purple-100'
    },
    {
      name: 'Avg Order',
      value: `${currencySymbol}${dashboardData.period.avgOrderValue.toFixed(2)}`,
      icon: FiTrendingUp,
      color: 'text-indigo-600 bg-indigo-100'
    },
  ];

  // Transform chart data for SalesTrendChart component
  const salesTrendData = chartData?.salesChart.map(item => ({
    date: item._id,
    sales: item.totalSales,
    orders: item.totalOrders
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time sales analytics and metrics</p>
        </div>
        <div className="flex items-center mt-4 space-x-2 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as FilterType)}
            className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          >
            <option value="today">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
        </div>
      </div>

      {/* Date Range Display */}
      {dashboardData.dateRange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiClock className="h-4 w-4" />
          <span className="font-medium">{dashboardData.periodLabel}</span>
          <span className="text-gray-400">
            ({new Date(dashboardData.dateRange.start).toLocaleDateString()} - {new Date(dashboardData.dateRange.end).toLocaleDateString()})
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statsConfig.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      <QuickStats stats={quickStatsConfig} />

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
          <div className="flex gap-2">
            {(['7days', '30days', '12months'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartPeriod === period
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === '7days' ? '7 Days' : period === '30days' ? '30 Days' : '12 Months'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SalesTrendChart
            data={salesTrendData}
            title={`Sales (${currencySymbol})`}
            dataKey="sales"
            color="#dc2626"
          />
          <SalesTrendChart
            data={salesTrendData}
            title="Orders"
            dataKey="orders"
            color="#f97316"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardClient;
