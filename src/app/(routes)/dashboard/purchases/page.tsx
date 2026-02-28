'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShoppingCart,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  X,
} from 'lucide-react';
import { vendorService } from '../vendors/service/vendorService';
import type { Purchase, Vendor } from '../vendors/types';

const purchasesPerPage = 10;

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
type StatusFilterType = 'all' | 'pending' | 'partial' | 'paid' | 'overdue';

interface PurchaseSummary {
  totalPurchases: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  purchaseCount: number;
}

export default function PurchasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get('dateFilter') as DateFilterType) || 'all'
  );
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(
    (searchParams.get('status') as StatusFilterType) || 'all'
  );
  const [vendorFilter, setVendorFilter] = useState(searchParams.get('vendor') || 'all');

  const [currentPage, setCurrentPage] = useState(1);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      setError(null);

      let params: { startDate?: string; endDate?: string } = {};

      // Build date params
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

      const [purchasesData, vendorsData] = await Promise.all([
        vendorService.getPurchases(params),
        vendorService.getVendors(),
      ]);

      setPurchases(purchasesData);
      setVendors(vendorsData);
    } catch (e) {
      console.error('Error fetching data:', e);
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
    if (customStartDate) params.set('startDate', customStartDate);
    if (customEndDate) params.set('endDate', customEndDate);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (vendorFilter !== 'all') params.set('vendor', vendorFilter);

    const queryString = params.toString();
    router.replace(`/dashboard/purchases${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [searchTerm, dateFilter, customStartDate, customEndDate, statusFilter, vendorFilter, router]);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        purchase.invoiceNumber.toLowerCase().includes(term) ||
        (purchase.vendor?.name || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || purchase.paymentStatus === statusFilter;

      const matchesVendor = vendorFilter === 'all' || purchase.vendorId === vendorFilter;

      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [purchases, searchTerm, statusFilter, vendorFilter]);

  // Calculate summary
  const summary: PurchaseSummary = useMemo(() => {
    return filteredPurchases.reduce(
      (acc, p) => ({
        totalPurchases: acc.totalPurchases + 1,
        totalAmount: acc.totalAmount + p.total,
        totalPaid: acc.totalPaid + p.paidAmount,
        totalPending: acc.totalPending + p.pendingAmount,
        purchaseCount: acc.purchaseCount + 1,
      }),
      { totalPurchases: 0, totalAmount: 0, totalPaid: 0, totalPending: 0, purchaseCount: 0 }
    );
  }, [filteredPurchases]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / purchasesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLast = clampedPage * purchasesPerPage;
  const indexOfFirst = indexOfLast - purchasesPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleDelete = async () => {
    if (!deletingPurchase) return;

    setDeleteLoading(true);
    try {
      await vendorService.deletePurchase(deletingPurchase._id);
      setPurchases((prev) => prev.filter((p) => p._id !== deletingPurchase._id));
      setIsDeleteModalOpen(false);
      setDeletingPurchase(null);
    } catch (e) {
      console.error('Error deleting purchase:', e);
      setError('Failed to delete purchase');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPaymentModal = (purchase: Purchase) => {
    setPayingPurchase(purchase);
    setPaymentAmount(purchase.pendingAmount.toString());
    setPaymentMethod('cash');
    setPaymentReference('');
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!payingPurchase || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > payingPurchase.pendingAmount) {
      setError('Payment amount cannot exceed pending amount');
      return;
    }

    setPaymentLoading(true);
    setError(null);
    try {
      await vendorService.createPayment({
        vendorId: payingPurchase.vendorId,
        purchaseId: payingPurchase._id,
        amount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod,
        reference: paymentReference.trim() || undefined,
      });

      // Update local purchase state
      setPurchases((prev) =>
        prev.map((p) => {
          if (p._id === payingPurchase._id) {
            const newPaidAmount = p.paidAmount + amount;
            const newPendingAmount = p.total - newPaidAmount;
            return {
              ...p,
              paidAmount: newPaidAmount,
              pendingAmount: newPendingAmount,
              paymentStatus: newPendingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : p.paymentStatus,
            };
          }
          return p;
        })
      );

      setIsPaymentModalOpen(false);
      setPayingPurchase(null);
      setPaymentAmount('');
    } catch (e) {
      console.error('Error creating payment:', e);
      setError('Failed to create payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Partial
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const getDateRangeLabel = () => {
    switch (dateFilter) {
      case 'today': return "Today";
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'custom': return customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : 'Custom';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="mt-1 text-sm text-gray-500">Manage vendor purchases and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard/purchases/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="h-5 w-5" />
            Add Purchase
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-xl font-bold text-gray-900">{summary.purchaseCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Amount</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Total Paid</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Total Pending</p>
              <p className="text-xl font-bold text-orange-700">{formatCurrency(summary.totalPending)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setDateFilter(e.target.value as DateFilterType);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              />
            </>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setStatusFilter(e.target.value as StatusFilterType);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setVendorFilter(e.target.value);
            }}
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Purchase Orders ({filteredPurchases.length}) - {getDateRangeLabel()}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                  title="💳 Add Payment | 👁️ View Details | ✏️ Edit | 🗑️ Delete"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No purchases found</p>
                  </td>
                </tr>
              ) : (
                currentPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {purchase.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(purchase.purchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.vendor?.name || 'Unknown Vendor'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(purchase.paidAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${purchase.pendingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatCurrency(purchase.pendingAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {purchase.pendingAmount > 0 && (
                          <div className="relative group">
                            <button
                              onClick={() => openPaymentModal(purchase)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Add Payment
                            </span>
                          </div>
                        )}
                        <div className="relative group">
                          <button
                            onClick={() => window.open(`/dashboard/purchases/${purchase._id}`, '_blank')}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            View Details
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => router.push(`/dashboard/purchases/edit/${purchase._id}`)}
                            className="p-1.5 text-gray-600 hover:text-[#dc2626] hover:bg-gray-50 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Edit
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => {
                              setDeletingPurchase(purchase);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Delete
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {currentPurchases.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                    Page Totals
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">
                    {formatCurrency(currentPurchases.reduce((sum, p) => sum + p.total, 0))}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-green-600">
                    {formatCurrency(currentPurchases.reduce((sum, p) => sum + p.paidAmount, 0))}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-red-600">
                    {formatCurrency(currentPurchases.reduce((sum, p) => sum + p.pendingAmount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredPurchases.length === 0 ? 0 : indexOfFirst + 1} to{' '}
          {Math.min(indexOfLast, filteredPurchases.length)} of {filteredPurchases.length} purchases
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {clampedPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Purchase</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete invoice <strong>{deletingPurchase?.invoiceNumber}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg">
              This is a soft delete. The purchase will be hidden but can be restored later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingPurchase(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && payingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Invoice Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Invoice</span>
                <span className="text-sm font-mono font-medium">{payingPurchase.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Vendor</span>
                <span className="text-sm font-medium">{payingPurchase.vendor?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="text-sm font-medium">{formatCurrency(payingPurchase.total)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Already Paid</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(payingPurchase.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium text-gray-700">Pending Amount</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(payingPurchase.pendingAmount)}</span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="Enter amount"
                  min="0"
                  max={payingPurchase.pendingAmount}
                  step="0.01"
                />
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(payingPurchase.pendingAmount.toString())}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Full Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((payingPurchase.pendingAmount / 2).toFixed(0))}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Half Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank' | 'cheque' | 'other')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="Transaction ID, cheque number, etc."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPayingPurchase(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading || !paymentAmount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {paymentLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
