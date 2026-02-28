'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  RefreshCw,
  Loader2,
  Download,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { vendorService } from '../../vendors/service/vendorService';
import type { Purchase, Vendor, VendorDashboardStats } from '../../vendors/types';
import jsPDF from 'jspdf';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function PurchaseReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get('dateFilter') as DateFilterType) || 'month'
  );
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');
  const [vendorFilter, setVendorFilter] = useState(searchParams.get('vendor') || 'all');

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      let params: { startDate?: string; endDate?: string } = {};

      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.startDate = today;
        params.endDate = today;
      } else if (dateFilter === 'week') {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const [purchasesData, vendorsData, statsData] = await Promise.all([
        vendorService.getPurchases(params),
        vendorService.getVendors(),
        vendorService.getVendorDashboardStats(),
      ]);

      setPurchases(purchasesData);
      setVendors(vendorsData);
      setStats(statsData);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
    if (customStartDate) params.set('startDate', customStartDate);
    if (customEndDate) params.set('endDate', customEndDate);
    if (vendorFilter !== 'all') params.set('vendor', vendorFilter);

    const queryString = params.toString();
    router.replace(`/dashboard/reporting/purchases${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [dateFilter, customStartDate, customEndDate, vendorFilter, router]);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    if (vendorFilter === 'all') return purchases;
    return purchases.filter(p => p.vendorId === vendorFilter);
  }, [purchases, vendorFilter]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalPaid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPending = filteredPurchases.reduce((sum, p) => sum + p.pendingAmount, 0);
    const paidCount = filteredPurchases.filter(p => p.paymentStatus === 'paid').length;
    const pendingCount = filteredPurchases.filter(p => p.paymentStatus === 'pending').length;
    const partialCount = filteredPurchases.filter(p => p.paymentStatus === 'partial').length;
    const overdueCount = filteredPurchases.filter(p => p.paymentStatus === 'overdue').length;

    return {
      totalAmount,
      totalPaid,
      totalPending,
      count: filteredPurchases.length,
      paidCount,
      pendingCount,
      partialCount,
      overdueCount,
    };
  }, [filteredPurchases]);

  // Vendor-wise breakdown
  const vendorBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; total: number; paid: number; pending: number; count: number }> = {};

    filteredPurchases.forEach(p => {
      if (!breakdown[p.vendorId]) {
        breakdown[p.vendorId] = {
          name: p.vendor?.name || 'Unknown',
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
        };
      }
      breakdown[p.vendorId].total += p.total;
      breakdown[p.vendorId].paid += p.paidAmount;
      breakdown[p.vendorId].pending += p.pendingAmount;
      breakdown[p.vendorId].count += 1;
    });

    return Object.entries(breakdown)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  const getDateRangeLabel = () => {
    switch (dateFilter) {
      case 'today': return "Today";
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'custom': return customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : 'Custom';
      default: return 'All Time';
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE REPORT', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
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
    doc.text(`Total Purchases: ${summary.count}`, 14, yPos);
    doc.text(`Total Amount: Rs ${summary.totalAmount.toLocaleString()}`, 80, yPos);
    yPos += 6;
    doc.text(`Total Paid: Rs ${summary.totalPaid.toLocaleString()}`, 14, yPos);
    doc.text(`Total Pending: Rs ${summary.totalPending.toLocaleString()}`, 80, yPos);
    yPos += 6;
    doc.text(`Paid: ${summary.paidCount} | Partial: ${summary.partialCount} | Pending: ${summary.pendingCount} | Overdue: ${summary.overdueCount}`, 14, yPos);
    yPos += 12;

    // Vendor Breakdown
    if (vendorBreakdown.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Vendor-wise Breakdown', 14, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.text('Vendor', 16, yPos);
      doc.text('Count', 90, yPos);
      doc.text('Total', 115, yPos);
      doc.text('Paid', 145, yPos);
      doc.text('Pending', 175, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      vendorBreakdown.forEach(v => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(v.name.slice(0, 30), 16, yPos);
        doc.text(v.count.toString(), 90, yPos);
        doc.text(v.total.toLocaleString(), 115, yPos);
        doc.text(v.paid.toLocaleString(), 145, yPos);
        doc.text(v.pending.toLocaleString(), 175, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    // Purchase List
    if (filteredPurchases.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Purchase Details', 14, yPos);
      yPos += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.text('Invoice #', 16, yPos);
      doc.text('Date', 45, yPos);
      doc.text('Vendor', 70, yPos);
      doc.text('Total', 115, yPos);
      doc.text('Paid', 140, yPos);
      doc.text('Pending', 165, yPos);
      doc.text('Status', 185, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      filteredPurchases.forEach(p => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(p.invoiceNumber.slice(0, 15), 16, yPos);
        doc.text(formatDate(p.purchaseDate), 45, yPos);
        doc.text((p.vendor?.name || 'Unknown').slice(0, 20), 70, yPos);
        doc.text(p.total.toLocaleString(), 115, yPos);
        doc.text(p.paidAmount.toLocaleString(), 140, yPos);
        doc.text(p.pendingAmount.toLocaleString(), 165, yPos);
        doc.text(p.paymentStatus, 185, yPos);
        yPos += 5;
      });
    }

    doc.save(`Purchase_Report_${getDateRangeLabel().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Paid</span>;
      case 'partial':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Partial</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze purchase trends and vendor payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadReport}
            disabled={loading || filteredPurchases.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vendors</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalVendors ?? vendors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Total Payable</p>
              <p className="text-xl font-bold text-orange-700">{formatCurrency(stats?.totalPayable ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">Overdue</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(stats?.totalOverdue ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Paid Vendors</p>
              <p className="text-xl font-bold text-green-700">{stats?.paidCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </>
          )}

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
          >
            <option value="all">All Vendors</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Period Summary - {getDateRangeLabel()}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-700">{summary.count}</p>
            <p className="text-sm text-blue-600">Total Purchases</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-700">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-sm text-green-600">Total Paid</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-700">{formatCurrency(summary.totalPending)}</p>
            <p className="text-sm text-orange-600">Total Pending</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-700">{summary.paidCount}</p>
              <p className="text-xs text-green-600">Paid</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-lg font-bold text-yellow-700">{summary.partialCount}</p>
              <p className="text-xs text-yellow-600">Partial</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-lg font-bold text-orange-700">{summary.pendingCount}</p>
              <p className="text-xs text-orange-600">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-700">{summary.overdueCount}</p>
              <p className="text-xs text-red-600">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Breakdown Table */}
      {vendorBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Vendor-wise Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorBreakdown.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{v.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">{v.count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(v.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-green-600">{formatCurrency(v.paid)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${v.pending > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatCurrency(v.pending)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => window.open(`/dashboard/vendors/${v.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Vendor"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td className="px-6 py-3 text-sm font-bold text-gray-700">Total</td>
                  <td className="px-6 py-3 text-center text-sm font-bold text-gray-700">{summary.count}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-600">{formatCurrency(summary.totalPaid)}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-red-600">{formatCurrency(summary.totalPending)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Purchase List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Purchase Details ({filteredPurchases.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">View</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No purchases found</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900">{p.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(p.purchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {p.vendor?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                      {formatCurrency(p.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${p.pendingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatCurrency(p.pendingAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(p.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => window.open(`/dashboard/purchases/${p._id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Purchase"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
