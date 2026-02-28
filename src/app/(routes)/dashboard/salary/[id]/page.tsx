'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import { salaryService } from '../service/salaryService';
import type { Salary, RawSalary, CreatePaymentData } from '../types';
import PaymentModal from '../components/PaymentModal';
import PaymentHistory from '../components/PaymentHistory';
import DeleteModal from '../components/DeleteModal';

const SalaryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const salaryId = params.id as string;

  const [salary, setSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // Delete payment modal states
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState<boolean>(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [deletePaymentLoading, setDeletePaymentLoading] = useState<boolean>(false);

  // Fetch salary on mount
  useEffect(() => {
    if (salaryId) {
      fetchSalary();
    }
  }, [salaryId]);

  const fetchSalary = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await salaryService.getSalary(salaryId);

      if (!data) {
        setError('Salary record not found');
        return;
      }

      const s = data as RawSalary;
      const employeeName = s.employee?.name ||
        (s.employee?.firstName && s.employee?.lastName
          ? `${s.employee.firstName} ${s.employee.lastName}`.trim()
          : 'Unknown');

      const typed: Salary = {
        _id: String(s._id),
        employee: {
          _id: String(s.employee?._id ?? ''),
          name: employeeName,
          email: String(s.employee?.email ?? ''),
        },
        baseSalary: typeof s.baseSalary === 'number' ? s.baseSalary : 0,
        month: String(s.month ?? ''),
        year: typeof s.year === 'number' ? s.year : new Date().getFullYear(),
        payments: Array.isArray(s.payments) ? s.payments : [],
        totalPaid: typeof s.totalPaid === 'number' ? s.totalPaid : 0,
        remainingBalance: typeof s.remainingBalance === 'number' ? s.remainingBalance : (s.baseSalary ?? 0),
        status: s.status ?? 'pending',
        notes: s.notes,
        createdAt: String(s.createdAt ?? new Date().toISOString()),
        updatedAt: String(s.updatedAt ?? new Date().toISOString()),
      };

      setSalary(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch salary record');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    if (!salary || salary.baseSalary === 0) return 0;
    return Math.round((salary.totalPaid / salary.baseSalary) * 100);
  };

  const getStatusBadgeClass = (status: Salary['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handlers
  const handleAddPayment = async (paymentData: CreatePaymentData) => {
    setPaymentLoading(true);
    try {
      await salaryService.addPayment(salaryId, paymentData);
      await fetchSalary();
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to add payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePaymentClick = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setIsDeletePaymentModalOpen(true);
  };

  const handleDeletePaymentConfirm = async () => {
    if (!deletingPaymentId) return;

    setDeletePaymentLoading(true);
    try {
      await salaryService.removePayment(salaryId, deletingPaymentId);
      await fetchSalary();
      setIsDeletePaymentModalOpen(false);
      setDeletingPaymentId(null);
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Failed to delete payment');
    } finally {
      setDeletePaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/salary"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Salary Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Salary record not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/salary"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Details</h1>
            <p className="text-sm text-gray-500 mt-1">
              {salary.employee.name} - {salary.month} {salary.year}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/salary/edit/${salary._id}`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Employee Info */}
          <div>
            <p className="text-sm text-gray-500">Employee</p>
            <p className="text-lg font-semibold text-gray-900">{salary.employee.name}</p>
            <p className="text-sm text-gray-500">{salary.employee.email}</p>
          </div>

          {/* Base Salary */}
          <div>
            <p className="text-sm text-gray-500">Base Salary</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(salary.baseSalary)}</p>
          </div>

          {/* Total Paid */}
          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(salary.totalPaid)}</p>
          </div>

          {/* Remaining */}
          <div>
            <p className="text-sm text-gray-500">Remaining Balance</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(salary.remainingBalance)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Payment Progress</span>
            <span className="text-sm font-medium text-gray-900">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#dc2626] h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Status and Actions */}
        <div className="mt-6 flex items-center justify-between">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
              salary.status
            )}`}
          >
            {salary.status === 'paid' ? 'Paid' : salary.status === 'partial' ? 'Partial' : 'Pending'}
          </span>

          {salary.status !== 'paid' && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>
          )}
        </div>

        {/* Notes */}
        {salary.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{salary.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <PaymentHistory
        payments={salary.payments}
        onDeletePayment={handleDeletePaymentClick}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleAddPayment}
        maxAmount={salary.remainingBalance}
        loading={paymentLoading}
      />

      {/* Delete Payment Modal */}
      <DeleteModal
        isOpen={isDeletePaymentModalOpen}
        onClose={() => {
          setIsDeletePaymentModalOpen(false);
          setDeletingPaymentId(null);
        }}
        onConfirm={handleDeletePaymentConfirm}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will update the remaining balance."
        loading={deletePaymentLoading}
      />
    </div>
  );
};

export default SalaryDetailPage;
