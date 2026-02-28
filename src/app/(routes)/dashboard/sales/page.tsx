// Sales Page - All Sales History
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Download, X, Loader2 } from 'lucide-react';
import { SalesOrder, SalesStats, DateFilterType } from './types';
import { fetchSalesOrders, calculateSalesStats, getStoreSettings, deleteSalesOrder } from './services/salesService';
import { printThermalReceipt } from './utils/receiptPrinter';
import { downloadBulkInvoicesPdf } from './utils/invoicePdfGenerator';
import SalesStatsCards from './components/SalesStatsCards';
import SalesFilters from './components/SalesFilters';
import SalesTable from './components/SalesTable';

export default function SalesPage() {
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
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
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

  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SalesOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/dashboard/sales?${queryString}`
      : '/dashboard/sales';

    // Update URL without page reload
    router.replace(newUrl, { scroll: false });
  }, [dateFilter, customStartDate, customEndDate, paymentFilter, statusFilter, searchQuery, router]);

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

      // Date filtering
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
      // Clear selection when orders refresh
      setSelectedOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch orders when filters change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter orders by search, payment method, and status (client-side)
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;

    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Get selected orders data
  const getSelectedOrdersData = () => {
    return filteredOrders.filter(order => selectedOrders.includes(order._id));
  };

  const handlePrintReceipt = (order: SalesOrder) => {
    printThermalReceipt(order, storeName, currency);
  };

  const handleViewInvoice = (order: SalesOrder) => {
    window.open(`/dashboard/pos/invoice/${order._id}`, '_blank');
  };

  const handleBulkDownload = async () => {
    const selectedData = getSelectedOrdersData();
    if (selectedData.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: selectedData.length });

    try {
      await downloadBulkInvoicesPdf(
        selectedData,
        { storeName, currency },
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );
      // Clear selection after successful download
      setSelectedOrders([]);
    } catch (error) {
      console.error('Failed to download invoices:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleClearSelection = () => {
    setSelectedOrders([]);
  };

  const handleDeleteOrder = (order: SalesOrder) => {
    setDeleteTarget(order);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSalesOrder(deleteTarget._id);
      setDeleteTarget(null);
      loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total of selected orders
  const selectedTotal = getSelectedOrdersData().reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all sales transactions</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {downloadProgress.current}/{downloadProgress.total}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download ({selectedOrders.length})
                </>
              )}
            </button>
          )}
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <SalesStatsCards stats={stats} loading={loading} currency={currency} />

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
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.length} invoice{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-blue-700">
              Total: {currency === 'PKR' ? 'Rs ' : '$'}{selectedTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating {downloadProgress.current}/{downloadProgress.total}...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDFs
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <SalesTable
        orders={filteredOrders}
        loading={loading}
        onPrintReceipt={handlePrintReceipt}
        onViewInvoice={handleViewInvoice}
        onDeleteOrder={handleDeleteOrder}
        currency={currency}
        selectedOrders={selectedOrders}
        onSelectionChange={setSelectedOrders}
      />

      {/* Summary Footer */}
      {!loading && filteredOrders.length > 0 && (
        <div className="text-sm text-gray-500 text-right">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Order</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete order <span className="font-medium">{deleteTarget.orderNumber}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-6">This action can be reversed by an administrator.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
