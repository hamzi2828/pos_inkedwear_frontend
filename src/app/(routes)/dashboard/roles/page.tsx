'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { roleService } from './service/roleService';
import type { Role, RawRole } from './types';
import PageHeader from './components/PageHeader';
import SearchFilters from './components/SearchFilters';
import RolesTable from './components/RolesTable';
import Pagination from './components/Pagination';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import DeleteModal from './components/DeleteModal';

const rolesPerPage = 10;

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await roleService.getRoles();

      const typed: Role[] = (Array.isArray(data) ? data : []).map((r: RawRole) => ({
        _id: String(r._id),
        name: String(r.name ?? ''),
        description: String(r.description ?? ''),
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
        isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
        createdAt: String(r.createdAt ?? new Date().toISOString()),
        updatedAt: String(r.updatedAt ?? new Date().toISOString()),
      }));

      setRoles(typed);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch roles. Please try again later.');
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
  const handleStatusToggle = async (roleId: string, isActive: boolean) => {
    try {
      // Optimistic UI
      setRoles((prev) => prev.map((r) => (r._id === roleId ? { ...r, isActive } : r)));
      await roleService.updateRoleStatus(roleId, isActive);
    } catch (err) {
      console.error('Error updating role status:', err);
      setError('Failed to update role status');
      // Rollback
      setRoles((prev) => prev.map((r) => (r._id === roleId ? { ...r, isActive: !isActive } : r)));
    }
  };

  const handleDeleteClick = (roleId: string) => {
    const role = roles.find((r) => r._id === roleId);
    if (role) {
      setDeletingRole(role);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRole) return;

    setDeleteLoading(true);
    try {
      await roleService.deleteRole(deletingRole._id);
      setRoles((prev) => prev.filter((r) => r._id !== deletingRole._id));
      setIsDeleteModalOpen(false);
      setDeletingRole(null);
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Derived data
  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return roles.filter((r) => {
      const matchesSearch =
        !term ||
        r.name?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? r.isActive : !r.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [roles, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / rolesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLastRole = clampedPage * rolesPerPage;
  const indexOfFirstRole = indexOfLastRole - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstRole, indexOfLastRole);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  // Show message if no roles exist
  if (roles.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Roles"
          subtitle="Manage user roles and permissions"
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Roles Found</h3>
          <p className="text-yellow-700 mb-4">You need to create roles before you can assign them to employees.</p>
          <Link
            href="/dashboard/roles/create"
            className="inline-block px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Create Your First Role
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        subtitle="Manage user roles and permissions"
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

      <RolesTable
        roles={currentRoles}
        onDelete={handleDeleteClick}
        onStatusToggle={handleStatusToggle}
        formatDate={formatDate}
      />

      <Pagination
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showingFrom={filteredRoles.length === 0 ? 0 : indexOfFirstRole + 1}
        showingTo={Math.min(indexOfLastRole, filteredRoles.length)}
        totalCount={filteredRoles.length}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRole(null);
        }}
        onConfirm={handleDeleteConfirm}
        roleName={deletingRole?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
};

export default RolesPage;
