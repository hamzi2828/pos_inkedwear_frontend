'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerService } from './service/customerService';
import type { Customer, RawCustomer } from './types';
import PageHeader from './components/PageHeader';
import SearchFilters from './components/SearchFilters';
import CustomersTable from './components/CustomersTable';
import Pagination from './components/Pagination';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import DeleteModal from './components/DeleteModal';

const customersPerPage = 10;

const CustomersPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await customerService.getCustomers();

      const typed: Customer[] = (Array.isArray(data) ? data : []).map((c: RawCustomer) => {
        // Handle carDetails - can be single object or array
        let carDetails: Customer['carDetails'];
        if (Array.isArray(c.carDetails)) {
          carDetails = c.carDetails.map(car => ({
            brand: car?.brand || '',
            model: car?.model || '',
            numberPlate: car?.numberPlate || '',
          }));
        } else if (c.carDetails) {
          carDetails = [{
            brand: c.carDetails?.brand || '',
            model: c.carDetails?.model || '',
            numberPlate: c.carDetails?.numberPlate || '',
          }];
        } else {
          carDetails = [];
        }

        return {
          _id: String(c._id),
          customerCode: c.customerCode,
          customerType: c.customerType,
          source: c.source,
          firstName: String(c.firstName ?? ''),
          lastName: String(c.lastName ?? ''),
          email: String(c.email ?? ''),
          phone: c.phone || null,
          address: {
            street: c.address?.street || '',
            city: c.address?.city || '',
            state: c.address?.state || '',
            zipCode: c.address?.zipCode || '',
            country: c.address?.country || '',
          },
          carDetails,
          notes: String(c.notes ?? ''),
          isActive: typeof c.isActive === 'boolean' ? c.isActive : true,
          createdAt: String(c.createdAt ?? new Date().toISOString()),
          updatedAt: String(c.updatedAt ?? new Date().toISOString()),
        };
      });

      setCustomers(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Handlers
  const handleStatusToggle = async (customerId: string, isActive: boolean) => {
    try {
      // Optimistic UI
      setCustomers((prev) => prev.map((c) => (c._id === customerId ? { ...c, isActive } : c)));
      await customerService.updateCustomerStatus(customerId, isActive);
    } catch (err) {
      console.error('Error updating customer status:', err);
      setError('Failed to update customer status');
      // Rollback
      setCustomers((prev) => prev.map((c) => (c._id === customerId ? { ...c, isActive: !isActive } : c)));
    }
  };

  const handleEdit = (customer: Customer) => {
    router.push(`/dashboard/customers/edit/${customer._id}`);
  };

  const handleDeleteClick = (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setDeletingCustomer(customer);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;

    setDeleteLoading(true);
    try {
      await customerService.deleteCustomer(deletingCustomer._id);
      setCustomers((prev) => prev.filter((c) => c._id !== deletingCustomer._id));
      setIsDeleteModalOpen(false);
      setDeletingCustomer(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Derived data
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return customers.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? c.isActive : !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastCustomer = clampedPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

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
        title="Customers"
        subtitle="Manage your customers and their information"
      />

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setCurrentPage(1);
          setSearchTerm(val);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setCurrentPage(1);
          setStatusFilter(val);
        }}
      />

      <CustomersTable
        customers={currentCustomers}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onStatusToggle={handleStatusToggle}
        formatDate={formatDate}
      />

      <Pagination
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showingFrom={filteredCustomers.length === 0 ? 0 : indexOfFirstCustomer + 1}
        showingTo={Math.min(indexOfLastCustomer, filteredCustomers.length)}
        totalCount={filteredCustomers.length}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomer(null);
        }}
        onConfirm={handleDeleteConfirm}
        customerName={deletingCustomer ? `${deletingCustomer.firstName} ${deletingCustomer.lastName}` : ''}
        loading={deleteLoading}
      />
    </div>
  );
};

export default CustomersPage;
