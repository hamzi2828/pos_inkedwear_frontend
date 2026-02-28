'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle, Receipt, Calendar } from 'lucide-react';

// Custom PKR icon component
const PkrIcon = ({ className }: { className?: string }) => (
  <span className={`font-bold ${className}`}>Rs</span>
);
import { expenseService } from './service/expenseService';
import type { Expense, RawExpense, ExpenseCategory, PaymentMethod, ExpenseSummary } from './types';
import { EXPENSE_CATEGORIES } from './types';

const expensesPerPage = 10;

const ExpensesPage = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch expenses on mount
  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await expenseService.getExpenses();

      const typed: Expense[] = (Array.isArray(data) ? data : []).map((e: RawExpense) => ({
        _id: String(e._id),
        title: String(e.title ?? ''),
        amount: Number(e.amount ?? 0),
        category: (e.category ?? 'Other') as ExpenseCategory,
        date: String(e.date ?? new Date().toISOString()),
        paymentMethod: (e.paymentMethod ?? 'Cash') as PaymentMethod,
        reference: String(e.reference ?? ''),
        notes: String(e.notes ?? ''),
        receipt: e.receipt || null,
        isActive: typeof e.isActive === 'boolean' ? e.isActive : true,
        createdAt: String(e.createdAt ?? new Date().toISOString()),
        updatedAt: String(e.updatedAt ?? new Date().toISOString()),
      }));

      setExpenses(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch expenses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await expenseService.getExpenseSummary();
      setSummary(data);
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  };

  // Helpers
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatCurrency = (amount: number) => `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Handlers
  const handleStatusToggle = async (expenseId: string, isActive: boolean) => {
    try {
      // Optimistic UI
      setExpenses((prev) => prev.map((e) => (e._id === expenseId ? { ...e, isActive } : e)));
      await expenseService.updateExpenseStatus(expenseId, isActive);
    } catch (err) {
      console.error('Error updating expense status:', err);
      setError('Failed to update expense status');
      // Rollback
      setExpenses((prev) => prev.map((e) => (e._id === expenseId ? { ...e, isActive: !isActive } : e)));
    }
  };

  const handleEdit = (expense: Expense) => {
    router.push(`/dashboard/expenses/edit/${expense._id}`);
  };

  const handleDeleteClick = (expenseId: string) => {
    const expense = expenses.find((e) => e._id === expenseId);
    if (expense) {
      setDeletingExpense(expense);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;

    setDeleteLoading(true);
    try {
      await expenseService.deleteExpense(deletingExpense._id);
      setExpenses((prev) => prev.filter((e) => e._id !== deletingExpense._id));
      setIsDeleteModalOpen(false);
      setDeletingExpense(null);
      fetchSummary();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Date range helper
  const getDateRange = (): { start: Date; end: Date } | null => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    switch (dateRange) {
      case 'daily':
        return { start: todayStart, end: todayEnd };
      case 'weekly': {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { start: weekStart, end: todayEnd };
      }
      case 'monthly': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: todayEnd };
      }
      case 'custom': {
        if (!customStartDate && !customEndDate) return null;
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : todayEnd;
        return { start, end };
      }
      default:
        return null;
    }
  };

  // Derived data
  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const range = getDateRange();

    return expenses.filter((e) => {
      const matchesSearch =
        !term ||
        e.title.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        e.paymentMethod.toLowerCase().includes(term) ||
        e.reference?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? e.isActive : !e.isActive);

      const matchesCategory =
        categoryFilter === 'all' || e.category === categoryFilter;

      let matchesDate = true;
      if (range) {
        const expenseDate = new Date(e.date);
        matchesDate = expenseDate >= range.start && expenseDate <= range.end;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [expenses, searchTerm, statusFilter, categoryFilter, dateRange, customStartDate, customEndDate]);

  // Compute summary from filtered expenses
  const filteredSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { totalExpenses: total, count: filteredExpenses.length };
  }, [filteredExpenses]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / expensesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastExpense = clampedPage * expensesPerPage;
  const indexOfFirstExpense = indexOfLastExpense - expensesPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstExpense, indexOfLastExpense);

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#dc2626]/10 rounded-full flex items-center justify-center">
              <PkrIcon className="h-5 w-5 text-[#dc2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(filteredSummary.totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-xl font-bold text-gray-900">{filteredSummary.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage your business expenses</p>
        </div>
        <Link
          href="/dashboard/expenses/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Expense
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setCategoryFilter(e.target.value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Date Range:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'all', label: 'All Time' },
            { value: 'daily', label: 'Today' },
            { value: 'weekly', label: 'This Week' },
            { value: 'monthly', label: 'This Month' },
            { value: 'custom', label: 'Custom' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setDateRange(opt.value);
                setCurrentPage(1);
                if (opt.value !== 'custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                dateRange === opt.value
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#dc2626]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No expenses found</p>
                  </td>
                </tr>
              ) : (
                currentExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-[#dc2626]/10 rounded-full flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-[#dc2626]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                      {expense.reference && (
                        <div className="text-xs text-gray-500">Ref: {expense.reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{expense.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(expense._id, !expense.isActive)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          expense.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {expense.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-gray-600 hover:text-[#dc2626] mr-3"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense._id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
          Showing {filteredExpenses.length === 0 ? 0 : indexOfFirstExpense + 1} to{' '}
          {Math.min(indexOfLastExpense, filteredExpenses.length)} of {filteredExpenses.length} expenses
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingExpense?.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingExpense(null);
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

export default ExpensesPage;
