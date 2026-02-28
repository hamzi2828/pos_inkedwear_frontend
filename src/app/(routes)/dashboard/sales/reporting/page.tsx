// Admin Reporting Page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Loader2, FileDown, FileText, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { SalesOrder, SalesStats, DateFilterType } from '../types';
import { fetchSalesOrders, calculateSalesStats, getStoreSettings } from '../services/salesService';
import { downloadBulkInvoicesPdf } from '../utils/invoicePdfGenerator';
import SalesStatsCards from '../components/SalesStatsCards';
import SalesFilters from '../components/SalesFilters';
import { expenseService } from '../../expenses/service/expenseService';
import { Expense } from '../../expenses/types';
import { productService, ProductUI } from '../../products/services/productService';

export default function AdminReportingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL params
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get('dateFilter') as DateFilterType) || 'all'
  );
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');
  const [paymentFilter, setPaymentFilter] = useState<string>(searchParams.get('payment') || 'all');
  const [storeName, setStoreName] = useState<string>('POS STORE');
  const [currency, setCurrency] = useState<string>('PKR');
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalOrders: 0,
    cashSales: 0,
    cardSales: 0,
    bankSales: 0,
    averageOrderValue: 0,
  });

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState({ current: 0, total: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [productCostMap, setProductCostMap] = useState<Map<string, number>>(new Map());

  // Load settings (only once on mount)
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getStoreSettings();
      if (settings?.storeName) {
        setStoreName(settings.storeName);
      }
      if (settings?.currency) {
        setCurrency(settings.currency);
      }
    };
    loadSettings();
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (dateFilter && dateFilter !== 'all') {
      params.set('dateFilter', dateFilter);
    }
    if (customStartDate) {
      params.set('startDate', customStartDate);
    }
    if (customEndDate) {
      params.set('endDate', customEndDate);
    }
    if (paymentFilter && paymentFilter !== 'all') {
      params.set('payment', paymentFilter);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/dashboard/sales/reporting?${queryString}`
      : '/dashboard/sales/reporting';

    // Update URL without page reload
    router.replace(newUrl, { scroll: false });
  }, [dateFilter, customStartDate, customEndDate, paymentFilter, searchQuery, router]);

  // Get date range based on filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (dateFilter === 'today') {
      startDate = now.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = monthAgo.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (dateFilter === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    }

    return { startDate, endDate };
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch expenses based on date range
  const loadExpenses = useCallback(async () => {
    // Skip if custom filter is selected but dates are incomplete
    if (dateFilter === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    try {
      const { startDate, endDate } = getDateRange();
      const allExpenses = await expenseService.getExpenses();

      // Filter expenses by date range
      let filteredExpenses = allExpenses;
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredExpenses = allExpenses.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        });
      }

      setExpenses(filteredExpenses);
      const total = filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
      setTotalExpenses(0);
    }
  }, [dateFilter, customStartDate, customEndDate, getDateRange]);

  // Fetch products to get cost prices
  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await productService.listProducts();
      setProducts(allProducts);

      // Create a map of product ID to costPrice
      const costMap = new Map<string, number>();
      allProducts.forEach((product: ProductUI) => {
        if (product.costPrice !== undefined && product.costPrice !== null) {
          costMap.set(product.id, product.costPrice);
        }
      });
      setProductCostMap(costMap);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setProductCostMap(new Map());
    }
  }, []);

  // Fetch orders
  const loadOrders = useCallback(async () => {
    // Skip fetching if custom filter is selected but dates are incomplete
    if (dateFilter === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    try {
      setLoading(true);

      const now = new Date();
      let params: { date?: string; startDate?: string; endDate?: string; limit: number } = {
        limit: 500,
      };

      if (dateFilter === 'today') {
        params.date = now.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const { orders: fetchedOrders } = await fetchSalesOrders(params);
      setOrders(fetchedOrders);
      setStats(calculateSalesStats(fetchedOrders));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Load products once on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fetch orders and expenses when filters change
  useEffect(() => {
    loadOrders();
    loadExpenses();
  }, [loadOrders, loadExpenses]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Download all orders for the selected date range
  const handleDownloadAllForRange = async () => {
    if (filteredOrders.length === 0) return;

    setIsDownloadingAll(true);
    setDownloadAllProgress({ current: 0, total: filteredOrders.length });

    try {
      await downloadBulkInvoicesPdf(
        filteredOrders,
        {
          storeName,
          currency,
          totalExpenses,
          totalProductCost: totalCostPrice,
          productCostMap,
        },
        (current, total) => {
          setDownloadAllProgress({ current, total });
        }
      );
    } catch (error) {
      console.error('Failed to download all invoices:', error);
    } finally {
      setIsDownloadingAll(false);
      setDownloadAllProgress({ current: 0, total: 0 });
    }
  };

  // Open summary page
  const handleViewSummary = () => {
    if (filteredOrders.length === 0) return;
    const params = new URLSearchParams();
    params.set('dateFilter', dateFilter);
    if (customStartDate) params.set('startDate', customStartDate);
    if (customEndDate) params.set('endDate', customEndDate);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (searchQuery) params.set('search', searchQuery);
    window.open(`/dashboard/sales/reporting/summary?${params.toString()}`, '_blank');
  };

  // Get display label for the current date range
  const getDateRangeLabel = (): string => {
    switch (dateFilter) {
      case 'today':
        return "Today's";
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      default:
        return 'All';
    }
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'Rs ';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return curr + ' ';
    }
  };

  // Calculate cost price for an order (sum of all items cost from product costPrice)
  const getOrderCostPrice = (order: SalesOrder): number => {
    return order.items.reduce((sum, item) => {
      // For outsource items, use the saved costPrice
      if (item.isOutsource && item.costPrice) {
        return sum + (item.costPrice * item.quantity);
      }

      // For regular products, look up costPrice from products
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      if (productId && productCostMap.has(productId)) {
        const costPrice = productCostMap.get(productId) || 0;
        return sum + (costPrice * item.quantity);
      }

      return sum;
    }, 0);
  };

  // Calculate total cost price for all filtered orders
  const totalCostPrice = filteredOrders.reduce((sum, order) => sum + getOrderCostPrice(order), 0);

  // Check if we have product cost data to show
  const hasProductCosts = totalCostPrice > 0;

  const handleViewInvoice = (order: SalesOrder) => {
    window.open(`/dashboard/sales/reporting/invoice/${order._id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sales"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Reporting</h1>
            <p className="text-sm text-gray-500 mt-1">Generate and download sales reports</p>
          </div>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <SalesStatsCards
        stats={stats}
        loading={loading}
        currency={currency}
        expenses={totalExpenses}
        productCost={totalCostPrice}
        showFinancials={true}
      />

      {/* Filters */}
      <SalesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      {/* Report Generation - Single Row */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-900">Generate Reports</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">Range: <span className="font-medium text-gray-700">{getDateRangeLabel()}</span></span>
          <span className="text-gray-500">Orders: <span className="font-medium text-gray-700">{filteredOrders.length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewSummary}
            disabled={loading || filteredOrders.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="View sales summary with totals and statistics"
          >
            <FileText className="h-4 w-4" />
            Summary
          </button>
          <button
            onClick={handleDownloadAllForRange}
            disabled={isDownloadingAll || loading || filteredOrders.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Download combined PDF with summary and all ${filteredOrders.length} invoices`}
          >
            {isDownloadingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {downloadAllProgress.current}/{downloadAllProgress.total}
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                All Invoices ({filteredOrders.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cost Summary - Only show if there are product costs */}
      {hasProductCosts && totalCostPrice > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-orange-900">Product Cost Summary</span>
            <span className="text-xs text-orange-600">(based on product cost prices)</span>
          </div>
          <span className="text-lg font-bold text-orange-700">{getCurrencySymbol(currency)}{totalCostPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Orders Summary Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Orders Summary</h3>
          {hasProductCosts && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Product Costs Included</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                {hasProductCosts && (
                  <th className="px-3 py-2 text-right text-xs font-medium text-orange-600 uppercase">Cost</th>
                )}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={hasProductCosts ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={hasProductCosts ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderCost = getOrderCostPrice(order);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{order.orderNumber}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Walk-in'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                          order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs">
                        {getCurrencySymbol(currency)}{order.total.toFixed(2)}
                      </td>
                      {hasProductCosts && (
                        <td className="px-3 py-2 text-right text-xs text-orange-600">
                          {orderCost > 0 ? `${getCurrencySymbol(currency)}${orderCost.toFixed(2)}` : '-'}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleViewInvoice(order)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals Row */}
            {!loading && filteredOrders.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase">Totals</td>
                  <td className="px-3 py-2 text-right font-bold text-sm">
                    {getCurrencySymbol(currency)}{filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                  </td>
                  {hasProductCosts && (
                    <td className="px-3 py-2 text-right font-bold text-sm text-orange-600">
                      {getCurrencySymbol(currency)}{totalCostPrice.toFixed(2)}
                    </td>
                  )}
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
