'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { attendanceService } from './service/attendanceService';
import { employeeService, Employee } from '../employees/service/employeeService';
import type { Attendance, RawAttendance, CreateAttendanceData, UpdateAttendanceData } from './types';
import type { User } from '../users/types';
import PageHeader from './components/PageHeader';
import SearchFilters from './components/SearchFilters';
import AttendanceTable from './components/AttendanceTable';
import Pagination from './components/Pagination';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import AttendanceModal from './components/AttendanceModal';
import DeleteModal from './components/DeleteModal';

const attendancesPerPage = 10;

const AttendancePage = () => {
  const searchParams = useSearchParams();
  const employeeIdFromUrl = searchParams.get('employeeId');

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>(employeeIdFromUrl || 'all');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingAttendance, setDeletingAttendance] = useState<Attendance | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [attendanceData, employeeData] = await Promise.all([
        attendanceService.getAttendances(),
        employeeService.getEmployees(),
      ]);

      // Process attendances
      const typedAttendances: Attendance[] = (Array.isArray(attendanceData) ? attendanceData : []).map(
        (a: RawAttendance) => {
          const employeeName =
            a.employee?.name ||
            (a.employee?.firstName && a.employee?.lastName
              ? `${a.employee.firstName} ${a.employee.lastName}`.trim()
              : 'Unknown');

          return {
            _id: String(a._id),
            employee: {
              _id: String(a.employee?._id ?? ''),
              name: employeeName,
              email: String(a.employee?.email ?? ''),
            },
            date: String(a.date ?? new Date().toISOString()),
            status: a.status ?? 'present',
            notes: a.notes,
            createdAt: String(a.createdAt ?? new Date().toISOString()),
            updatedAt: String(a.updatedAt ?? new Date().toISOString()),
          };
        }
      );

      // Process employees
      const typedEmployees: User[] = (Array.isArray(employeeData) ? employeeData : []).map(
        (u: Employee) => {
          const derivedName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          const name = u.name || derivedName || '';
          return {
            _id: String(u._id),
            name,
            email: String(u.email ?? ''),
            role: u.role ?? 'user',
            isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
            createdAt: String(u.createdAt ?? new Date().toISOString()),
            updatedAt: String(u.updatedAt ?? new Date().toISOString()),
          };
        }
      );

      setAttendances(typedAttendances);
      setEmployees(typedEmployees);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch attendance records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handlers
  const handleOpenModal = () => {
    setEditingAttendance(null);
    setIsModalOpen(true);
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CreateAttendanceData | UpdateAttendanceData) => {
    setModalLoading(true);
    try {
      if (editingAttendance) {
        await attendanceService.updateAttendance(editingAttendance._id, data as UpdateAttendanceData);
      } else {
        await attendanceService.createAttendance(data as CreateAttendanceData);
      }
      await fetchData();
      setIsModalOpen(false);
      setEditingAttendance(null);
    } catch (err: unknown) {
      console.error('Error saving attendance:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to save attendance record';
      setError(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (attendanceId: string) => {
    const attendance = attendances.find((a) => a._id === attendanceId);
    if (attendance) {
      setDeletingAttendance(attendance);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAttendance) return;

    setDeleteLoading(true);
    try {
      await attendanceService.deleteAttendance(deletingAttendance._id);
      setAttendances((prev) => prev.filter((a) => a._id !== deletingAttendance._id));
      setIsDeleteModalOpen(false);
      setDeletingAttendance(null);
    } catch (err) {
      console.error('Error deleting attendance:', err);
      setError('Failed to delete attendance record');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Derived data
  const filteredAttendances = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return attendances.filter((a) => {
      const matchesSearch = !term || a.employee?.name?.toLowerCase().includes(term);

      const matchesEmployee =
        employeeFilter === 'all' || a.employee._id === employeeFilter;

      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

      const attendanceDate = new Date(a.date);
      const matchesDateFrom = !dateFrom || attendanceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || attendanceDate <= new Date(dateTo);

      return (
        matchesSearch && matchesEmployee && matchesStatus && matchesDateFrom && matchesDateTo
      );
    });
  }, [attendances, searchTerm, employeeFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredAttendances.length / attendancesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastAttendance = clampedPage * attendancesPerPage;
  const indexOfFirstAttendance = indexOfLastAttendance - attendancesPerPage;
  const currentAttendances = filteredAttendances.slice(indexOfFirstAttendance, indexOfLastAttendance);

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
        title="Attendance Management"
        subtitle="Track employee attendance records"
        onMarkAttendance={handleOpenModal}
      />

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setCurrentPage(1);
          setSearchTerm(val);
        }}
        dateFrom={dateFrom}
        onDateFromChange={(val) => {
          setCurrentPage(1);
          setDateFrom(val);
        }}
        dateTo={dateTo}
        onDateToChange={(val) => {
          setCurrentPage(1);
          setDateTo(val);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setCurrentPage(1);
          setStatusFilter(val);
        }}
        employees={employees}
        employeeFilter={employeeFilter}
        onEmployeeFilterChange={(val) => {
          setCurrentPage(1);
          setEmployeeFilter(val);
        }}
      />

      <AttendanceTable
        attendances={currentAttendances}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        formatDate={formatDate}
      />

      <Pagination
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showingFrom={filteredAttendances.length === 0 ? 0 : indexOfFirstAttendance + 1}
        showingTo={Math.min(indexOfLastAttendance, filteredAttendances.length)}
        totalCount={filteredAttendances.length}
      />

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttendance(null);
        }}
        onSubmit={handleModalSubmit}
        employees={employees}
        editingAttendance={editingAttendance}
        loading={modalLoading}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAttendance(null);
        }}
        onConfirm={handleDeleteConfirm}
        employeeName={deletingAttendance?.employee?.name || ''}
        date={deletingAttendance ? formatDate(deletingAttendance.date) : ''}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AttendancePage;
