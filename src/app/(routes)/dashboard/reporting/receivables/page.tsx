// Receivables Page - Track pending and partial payments
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Download, AlertCircle, CheckCircle, Clock, User, Phone, Car } from 'lucide-react';
import { SalesOrder, DateFilterType } from '../../sales/types';
import { fetchSalesOrders, getStoreSettings } from '../../sales/services/salesService';
import jsPDF from 'jspdf';

type TabType = 'all' | 'pending' | 'partial';

export default function ReceivablesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get('dateFilter') as DateFilterType) || 'all'
  );
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'all'
  );
  const [currency, setCurrency] = useState<string>('PKR');
  const [storeName, setStoreName] = useState<string>('Store');

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getStoreSettings();
        if (settings?.currency) setCurrency(settings.currency);
        if (settings?.storeName) setStoreName(settings.storeName);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (activeTab && activeTab !== 'all') {
      params.set('tab', activeTab);
    }
    if (dateFilter && dateFilter !== 'all') {
      params.set('dateFilter', dateFilter);
    }
    if (customStartDate) {
      params.set('startDate', customStartDate);
    }
    if (customEndDate) {
      params.set('endDate', customEndDate);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/dashboard/reporting/receivables?${queryString}`
      : '/dashboard/reporting/receivables';

    router.replace(newUrl, { scroll: false });
  }, [activeTab, dateFilter, customStartDate, customEndDate, searchQuery, router]);

  // Fetch orders with pending/partial status
  const loadOrders = useCallback(async () => {
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

      // Filter only pending and partial payment orders
      const receivableOrders = fetchedOrders.filter(
        order => order.paymentStatus === 'pending' || order.paymentStatus === 'partial'
      );

      setOrders(receivableOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'Rs ';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return curr + ' ';
    }
  };

  const symbol = getCurrencySymbol(currency);

  // Filter orders based on active tab and search
  const getFilteredOrders = (): SalesOrder[] => {
    let filtered = orders;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(o => o.paymentStatus === 'pending');
    } else if (activeTab === 'partial') {
      filtered = filtered.filter(o => o.paymentStatus === 'partial');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer?.firstName?.toLowerCase().includes(query) ||
        order.customer?.lastName?.toLowerCase().includes(query) ||
        order.customer?.phone?.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredOrders = getFilteredOrders();

  // Calculate totals
  const pendingOrders = orders.filter(o => o.paymentStatus === 'pending');
  const partialOrders = orders.filter(o => o.paymentStatus === 'partial');

  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + (o.pendingAmount || o.total), 0);
  const totalPartialPending = partialOrders.reduce((sum, o) => sum + (o.pendingAmount || 0), 0);
  const totalPartialPaid = partialOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalReceivable = totalPendingAmount + totalPartialPending;

  const getDateRangeLabel = (): string => {
    switch (dateFilter) {
      case 'today': return "Today";
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      default: return 'All Time';
    }
  };

  // Download PDF report
  const handleDownloadPdf = () => {
    if (filteredOrders.length === 0) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVABLES REPORT', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(storeName, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Period: ${getDateRangeLabel()}`, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Receivable: ${symbol}${totalReceivable.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Pending Orders: ${pendingOrders.length} (${symbol}${totalPendingAmount.toFixed(2)})`, 14, yPos);
    yPos += 6;
    doc.text(`Partial Orders: ${partialOrders.length} (Paid: ${symbol}${totalPartialPaid.toFixed(2)}, Due: ${symbol}${totalPartialPending.toFixed(2)})`, 14, yPos);
    yPos += 12;

    // Table header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Order #', 14, yPos);
    doc.text('Date', 45, yPos);
    doc.text('Customer', 70, yPos);
    doc.text('Status', 110, yPos);
    doc.text('Total', 135, yPos);
    doc.text('Paid', 155, yPos);
    doc.text('Due', 175, yPos);
    yPos += 5;

    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos - 2, 196, yPos - 2);

    // Items
    doc.setFont('helvetica', 'normal');
    filteredOrders.forEach((order) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }

      const orderNum = order.orderNumber.length > 15 ? order.orderNumber.slice(-15) : order.orderNumber;
      const customerName = order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.slice(0, 20)
        : 'Walk-in';
      const paidAmount = order.paidAmount || 0;
      const pendingAmount = order.pendingAmount || order.total;

      doc.text(orderNum, 14, yPos);
      doc.text(new Date(order.createdAt).toLocaleDateString(), 45, yPos);
      doc.text(customerName, 70, yPos);
      doc.text(order.paymentStatus.toUpperCase(), 110, yPos);
      doc.text(order.total.toFixed(0), 135, yPos);
      doc.text(paidAmount.toFixed(0), 155, yPos);
      doc.text(pendingAmount.toFixed(0), 175, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Grand total
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(220, 38, 38);
    doc.rect(14, yPos, 182, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL RECEIVABLE', 16, yPos + 8);
    doc.text(`${symbol}${totalReceivable.toFixed(2)}`, 180, yPos + 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    const filename = `Receivables_${getDateRangeLabel().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receivables</h1>
          <p className="text-sm text-gray-500 mt-1">Track pending and partial payments to receive</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={loading || filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">Total Receivable</p>
          <p className="text-2xl font-bold text-red-700">{symbol}{totalReceivable.toFixed(0)}</p>
          <p className="text-xs text-red-500 mt-1">{orders.length} order(s)</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <p className="text-sm text-orange-600">Fully Pending</p>
          <p className="text-2xl font-bold text-orange-700">{symbol}{totalPendingAmount.toFixed(0)}</p>
          <p className="text-xs text-orange-500 mt-1">{pendingOrders.length} order(s)</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Partial - Received</p>
          <p className="text-2xl font-bold text-yellow-700">{symbol}{totalPartialPaid.toFixed(0)}</p>
          <p className="text-xs text-yellow-500 mt-1">{partialOrders.length} order(s)</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-sm text-purple-600">Partial - Due</p>
          <p className="text-2xl font-bold text-purple-700">{symbol}{totalPartialPending.toFixed(0)}</p>
          <p className="text-xs text-purple-500 mt-1">Remaining balance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-3 w-3 inline mr-1" />
          Pending ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('partial')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'partial'
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Partial ({partialOrders.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, phone..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        {dateFilter === 'custom' && (
          <>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">
            {activeTab === 'all' ? 'All Receivables' : activeTab === 'pending' ? 'Pending Payments' : 'Partial Payments'}
            ({filteredOrders.length}) - {getDateRangeLabel()}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-green-600 uppercase">Paid</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-red-600 uppercase">Due</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                    <p className="text-gray-500">No pending receivables</p>
                    <p className="text-xs text-gray-400 mt-1">All payments are up to date!</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const paidAmount = order.paidAmount || 0;
                  const pendingAmount = order.pendingAmount || order.total;
                  const progressPercent = order.total > 0 ? (paidAmount / order.total) * 100 : 0;

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.customer ? (
                          <div>
                            <div className="flex items-center gap-1 font-medium text-gray-900">
                              <User className="h-3 w-3 text-gray-400" />
                              {order.customer.firstName} {order.customer.lastName}
                            </div>
                            {order.customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {order.customer.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Walk-in</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                          order.paymentStatus === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus === 'pending' ? 'PENDING' : 'PARTIAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {symbol}{order.total.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">
                        {symbol}{paidAmount.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">
                        {symbol}{pendingAmount.toFixed(0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progressPercent === 0 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">{progressPercent.toFixed(0)}%</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filteredOrders.length > 0 && (
              <tfoot className="bg-red-50 border-t-2 border-red-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                    Total Receivable
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {symbol}{filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    {symbol}{filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">
                    {symbol}{filteredOrders.reduce((sum, o) => sum + (o.pendingAmount || o.total), 0).toFixed(0)}
                  </td>
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
