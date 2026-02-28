'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Truck,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { vendorService } from './service/vendorService';
import type { Vendor, RawVendor, VendorDashboardStats } from './types';

const vendorsPerPage = 10;

type PaymentFilterType = 'all' | 'pending' | 'partial' | 'paid' | 'overdue';

const VendorsPage = () => {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch vendors on mount
  useEffect(() => {
    fetchVendors();
    fetchStats();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await vendorService.getVendors();

      const typed: Vendor[] = (Array.isArray(data) ? data : []).map((v: RawVendor) => ({
        _id: String(v._id),
        name: String(v.name ?? ''),
        contactPerson: String(v.contactPerson ?? ''),
        email: String(v.email ?? ''),
        phone: v.phone || null,
        address: {
          street: v.address?.street || '',
          city: v.address?.city || '',
          state: v.address?.state || '',
          zipCode: v.address?.zipCode || '',
          country: v.address?.country || '',
        },
        category: String(v.category ?? ''),
        notes: String(v.notes ?? ''),
        isActive: typeof v.isActive === 'boolean' ? v.isActive : true,
        createdAt: String(v.createdAt ?? new Date().toISOString()),
        updatedAt: String(v.updatedAt ?? new Date().toISOString()),
        totalPurchase: v.totalPurchase ?? 0,
        totalPaid: v.totalPaid ?? 0,
        remainingBalance: v.remainingBalance ?? 0,
        paymentStatus: (v.paymentStatus as Vendor['paymentStatus']) ?? 'paid',
        dueDate: v.dueDate,
      }));

      setVendors(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch vendors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await vendorService.getVendorDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  // Helpers
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Handlers
  const handleStatusToggle = async (vendorId: string, isActive: boolean) => {
    try {
      // Optimistic UI
      setVendors((prev) => prev.map((v) => (v._id === vendorId ? { ...v, isActive } : v)));
      await vendorService.updateVendorStatus(vendorId, isActive);
    } catch (err) {
      console.error('Error updating vendor status:', err);
      setError('Failed to update vendor status');
      // Rollback
      setVendors((prev) => prev.map((v) => (v._id === vendorId ? { ...v, isActive: !isActive } : v)));
    }
  };

  const handleEdit = (vendor: Vendor) => {
    router.push(`/dashboard/vendors/edit/${vendor._id}`);
  };

  const handleDeleteClick = (vendorId: string) => {
    const vendor = vendors.find((v) => v._id === vendorId);
    if (vendor) {
      setDeletingVendor(vendor);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVendor) return;

    setDeleteLoading(true);
    try {
      await vendorService.deleteVendor(deletingVendor._id);
      setVendors((prev) => prev.filter((v) => v._id !== deletingVendor._id));
      setIsDeleteModalOpen(false);
      setDeletingVendor(null);
      fetchStats();
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('Failed to delete vendor');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string | undefined, balance: number | undefined) => {
    // If balance is 0, show as paid
    if (!balance || balance <= 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Paid
        </span>
      );
    }

    switch (status) {
      case 'overdue':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Partial
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
    }
  };

  // Derived data
  const filteredVendors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return vendors.filter((v) => {
      const matchesSearch =
        !term ||
        v.name.toLowerCase().includes(term) ||
        v.contactPerson.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.phone?.toLowerCase().includes(term) ||
        v.category?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? v.isActive : !v.isActive);

      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'paid' && (!v.remainingBalance || v.remainingBalance <= 0)) ||
        (paymentFilter === 'pending' && v.paymentStatus === 'pending' && (v.remainingBalance ?? 0) > 0) ||
        (paymentFilter === 'partial' && v.paymentStatus === 'partial') ||
        (paymentFilter === 'overdue' && v.paymentStatus === 'overdue');

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [vendors, searchTerm, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / vendorsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastVendor = clampedPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = filteredVendors.slice(indexOfFirstVendor, indexOfLastVendor);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your vendors and suppliers</p>
        </div>
        <Link
          href="/dashboard/vendors/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Vendor
        </Link>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
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
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(stats?.totalPayable ?? vendors.reduce((sum, v) => sum + (v.remainingBalance ?? 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">Overdue Amount</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(stats?.totalOverdue ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Fully Paid</p>
              <p className="text-xl font-bold text-green-700">{stats?.paidCount ?? 0} vendors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setPaymentFilter(e.target.value as PaymentFilterType);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Purchase
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                  title="👁️ View Details | ✏️ Edit | 🗑️ Delete"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No vendors found</p>
                  </td>
                </tr>
              ) : (
                currentVendors.map((vendor) => (
                  <tr
                    key={vendor._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-[#dc2626]/10 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-[#dc2626]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          <div className="text-sm text-gray-500">{vendor.category || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.contactPerson}</div>
                      <div className="text-sm text-gray-500">{vendor.phone || vendor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(vendor.totalPurchase ?? 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(vendor.totalPaid ?? 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${(vendor.remainingBalance ?? 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatCurrency(vendor.remainingBalance ?? 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(vendor.paymentStatus, vendor.remainingBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(vendor._id, !vendor.isActive);
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          vendor.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <div className="relative group">
                          <button
                            onClick={() => window.open(`/dashboard/vendors/${vendor._id}`, '_blank')}
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
                            onClick={() => handleEdit(vendor)}
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
                            onClick={() => handleDeleteClick(vendor._id)}
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
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredVendors.length === 0 ? 0 : indexOfFirstVendor + 1} to{' '}
          {Math.min(indexOfLastVendor, filteredVendors.length)} of {filteredVendors.length} vendors
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Vendor</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deletingVendor?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg">
              This is a soft delete. The vendor and related purchases will be hidden but can be restored later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingVendor(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
    </div>
  );
};

export default VendorsPage;
