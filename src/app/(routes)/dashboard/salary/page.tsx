'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { salaryService } from './service/salaryService';
import type { Salary, RawSalary } from './types';
import PageHeader from './components/PageHeader';
import SearchFilters from './components/SearchFilters';
import SalaryTable from './components/SalaryTable';
import Pagination from './components/Pagination';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import DeleteModal from './components/DeleteModal';

const salariesPerPage = 10;

const SalaryPage = () => {
  const searchParams = useSearchParams();
  const employeeIdFromUrl = searchParams.get('employeeId');

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>(employeeIdFromUrl || 'all');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingSalary, setDeletingSalary] = useState<Salary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch salaries on mount
  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await salaryService.getSalaries();

      const typed: Salary[] = (Array.isArray(data) ? data : []).map((s: RawSalary) => {
        const employeeName = s.employee?.name ||
          (s.employee?.firstName && s.employee?.lastName
            ? `${s.employee.firstName} ${s.employee.lastName}`.trim()
            : 'Unknown');

        return {
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
      });

      setSalaries(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch salary records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString()}`;
  };

  // Handlers
  const handleDeleteClick = (salaryId: string) => {
    const salary = salaries.find((s) => s._id === salaryId);
    if (salary) {
      setDeletingSalary(salary);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSalary) return;

    setDeleteLoading(true);
    try {
      await salaryService.deleteSalary(deletingSalary._id);
      setSalaries((prev) => prev.filter((s) => s._id !== deletingSalary._id));
      setIsDeleteModalOpen(false);
      setDeletingSalary(null);
    } catch (err) {
      console.error('Error deleting salary:', err);
      setError('Failed to delete salary record');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Derived data
  const filteredSalaries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return salaries.filter((s) => {
      const matchesSearch =
        !term || s.employee?.name?.toLowerCase().includes(term);

      const matchesMonth = monthFilter === 'all' || s.month === monthFilter;

      const matchesYear =
        yearFilter === 'all' || s.year === parseInt(yearFilter);

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      const matchesEmployee = employeeFilter === 'all' || s.employee?._id === employeeFilter;

      return matchesSearch && matchesMonth && matchesYear && matchesStatus && matchesEmployee;
    });
  }, [salaries, searchTerm, monthFilter, yearFilter, statusFilter, employeeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSalaries.length / salariesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastSalary = clampedPage * salariesPerPage;
  const indexOfFirstSalary = indexOfLastSalary - salariesPerPage;
  const currentSalaries = filteredSalaries.slice(indexOfFirstSalary, indexOfLastSalary);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Management"
        subtitle="Manage employee salaries and track payments"
      />

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setCurrentPage(1);
          setSearchTerm(val);
        }}
        monthFilter={monthFilter}
        onMonthFilterChange={(val) => {
          setCurrentPage(1);
          setMonthFilter(val);
        }}
        yearFilter={yearFilter}
        onYearFilterChange={(val) => {
          setCurrentPage(1);
          setYearFilter(val);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setCurrentPage(1);
          setStatusFilter(val);
        }}
      />

      <SalaryTable
        salaries={currentSalaries}
        onDelete={handleDeleteClick}
        formatCurrency={formatCurrency}
      />

      <Pagination
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showingFrom={filteredSalaries.length === 0 ? 0 : indexOfFirstSalary + 1}
        showingTo={Math.min(indexOfLastSalary, filteredSalaries.length)}
        totalCount={filteredSalaries.length}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSalary(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Salary Record"
        message={`Are you sure you want to delete the salary record for ${deletingSalary?.employee?.name || 'this employee'} (${deletingSalary?.month} ${deletingSalary?.year})? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SalaryPage;
