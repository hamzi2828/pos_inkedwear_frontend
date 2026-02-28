'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { employeeService, Employee, CreateEmployeeData } from './service/employeeService';
import { roleService } from '../roles/service/roleService';
import { Role } from '../roles/types';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { FiTrash2, FiEdit2, FiDollarSign, FiCalendar, FiActivity } from 'react-icons/fi';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import type { StylesConfig, Props as SelectProps } from 'react-select';

interface RoleOption {
  value: string;
  label: string;
  color: string;
}

// Typed Select component to avoid SSR issues
const Select = dynamic(
  () => import('react-select').then((mod) => mod.default),
  { ssr: false }
) as React.ComponentType<SelectProps<RoleOption, false>>;

const employeesPerPage = 10;

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cnic: string;
  position: string;
  department: string;
  role: string;
  salary: string;
  hireDate: string;
  gender: 'male' | 'female' | 'other' | '';
}

const initialFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cnic: '',
  position: '',
  department: '',
  role: '',
  salary: '',
  hireDate: '',
  gender: '',
};

const roleColorPalette = [
  { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' },
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  { bg: '#fef9c3', text: '#ca8a04', border: '#fde047' },
  { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' },
  { bg: '#fce7f3', text: '#db2777', border: '#f9a8d4' },
];

const getRoleColorObj = (roleName: string, roles: Role[]) => {
  const index = roles.findIndex(r => r.name === roleName);
  if (index === -1) return roleColorPalette[0];
  return roleColorPalette[index % roleColorPalette.length];
};

// Custom styles for react-select
const getSelectStyles = (roles: Role[]): StylesConfig<RoleOption, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    borderColor: state.isFocused ? '#dc2626' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : 'none',
    '&:hover': {
      borderColor: '#dc2626',
    },
  }),
  option: (base, { data, isFocused, isSelected }) => {
    const colors = getRoleColorObj(data.label, roles);
    return {
      ...base,
      backgroundColor: isSelected ? colors.bg : isFocused ? colors.bg : 'white',
      color: colors.text,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: colors.bg,
      },
    };
  },
  singleValue: (base, { data }) => {
    const colors = getRoleColorObj(data.label, roles);
    return {
      ...base,
      backgroundColor: colors.bg,
      color: colors.text,
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
    };
  },
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
});

// Compact styles for table inline select
const getTableSelectStyles = (roles: Role[]): StylesConfig<RoleOption, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '28px',
    height: '28px',
    borderColor: state.isFocused ? '#dc2626' : 'transparent',
    backgroundColor: 'transparent',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : 'none',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#dc2626',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 4px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '0 4px',
  }),
  option: (base, { data, isFocused, isSelected }) => {
    const colors = getRoleColorObj(data.label, roles);
    return {
      ...base,
      backgroundColor: isSelected ? colors.bg : isFocused ? colors.bg : 'white',
      color: colors.text,
      cursor: 'pointer',
      fontSize: '12px',
      padding: '6px 12px',
      '&:active': {
        backgroundColor: colors.bg,
      },
    };
  },
  singleValue: (base, { data }) => {
    const colors = getRoleColorObj(data.label, roles);
    return {
      ...base,
      backgroundColor: colors.bg,
      color: colors.text,
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
    };
  },
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    minWidth: '150px',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
});

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Role options for react-select
  const roleOptions: RoleOption[] = useMemo(() => {
    return roles.map((role) => {
      const colors = getRoleColorObj(role.name, roles);
      return {
        value: role.name,
        label: role.name,
        color: colors.text,
      };
    });
  }, [roles]);


  // Fetch employees and roles on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesData, rolesData] = await Promise.all([
        employeeService.getEmployees(),
        roleService.getRoles()
      ]);
      setEmployees(employeesData);
      // Filter only active roles for display
      setRoles(rolesData.filter((role: Role) => role.isActive));
    } catch (e) {
      console.error(e);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch employees. Please try again later.');
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return `Rs ${amount.toLocaleString()}`;
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      cnic: employee.cnic || '',
      position: employee.position || '',
      department: employee.department || '',
      role: employee.role || 'employee',
      salary: employee.salary?.toString() || '',
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
      gender: employee.gender || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const employeeData: CreateEmployeeData & { role?: string } = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        cnic: formData.cnic.trim() || undefined,
        position: formData.position.trim() || undefined,
        department: formData.department.trim() || undefined,
        role: formData.role,
        salary: Number(formData.salary),
        hireDate: formData.hireDate || undefined,
        gender: formData.gender || undefined,
      };

      if (editingEmployee) {
        const updated = await employeeService.updateEmployee(editingEmployee._id, employeeData);
        setEmployees(prev => prev.map(emp => emp._id === updated._id ? updated : emp));
      } else {
        const created = await employeeService.createEmployee(employeeData);
        setEmployees(prev => [created, ...prev]);
      }

      closeModal();
    } catch (err: unknown) {
      console.error('Error saving employee:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error?.response?.data?.message || 'Failed to save employee');
    } finally {
      setFormLoading(false);
    }
  };

  // Handlers
  const handleStatusToggle = async (employeeId: string, isActive: boolean) => {
    try {
      setEmployees(prev => prev.map(e => (e._id === employeeId ? { ...e, isActive } : e)));
      await employeeService.updateEmployeeStatus(employeeId, isActive);
    } catch (err) {
      console.error('Error updating employee status:', err);
      setError('Failed to update employee status');
      setEmployees(prev => prev.map(e => (e._id === employeeId ? { ...e, isActive: !isActive } : e)));
    }
  };

  const handleRoleChange = async (employeeId: string, role: string) => {
    const prevEmployee = employees.find(e => e._id === employeeId);
    try {
      setEmployees(prev => prev.map(e => (e._id === employeeId ? { ...e, role } : e)));
      await employeeService.updateEmployeeRole(employeeId, role);
    } catch (err) {
      console.error('Error updating employee role:', err);
      setError('Failed to update employee role');
      if (prevEmployee) {
        setEmployees(prev => prev.map(e => (e._id === employeeId ? { ...e, role: prevEmployee.role } : e)));
      }
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this employee?')) {
      try {
        setEmployees(prev => prev.filter(e => e._id !== employeeId));
        await employeeService.deleteEmployee(employeeId);
      } catch (err) {
        console.error('Error deleting employee:', err);
        setError('Failed to delete employee');
        fetchEmployees();
      }
    }
  };

  const handleViewSalary = (employeeId: string) => {
    window.open(`/dashboard/salary?employeeId=${employeeId}`, '_blank');
  };

  const handleViewAttendance = (employeeId: string) => {
    window.open(`/dashboard/attendance?employeeId=${employeeId}`, '_blank');
  };

  // Filtered data
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return employees.filter(e => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.position?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? e.isActive : !e.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const indexOfLast = clampedPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employees for salary and attendance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <Users className="h-5 w-5" />
            <span className="font-medium">{employees.length} Employees</span>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="block w-full py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
            placeholder="Search employees..."
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
            }}
            className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Position
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Salary
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No employees found. Click &quot;Add Employee&quot; to create one.
                  </td>
                </tr>
              ) : (
                currentEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="flex items-center justify-center w-10 h-10 text-white bg-[#dc2626] rounded-full">
                            {employee.firstName?.charAt(0)?.toUpperCase() || 'E'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-40">
                        <Select
                          value={roleOptions.find(opt => opt.value === employee.role) || null}
                          onChange={(selected) => {
                            if (selected) {
                              handleRoleChange(employee._id, selected.value);
                            }
                          }}
                          options={roleOptions}
                          styles={getTableSelectStyles(roles)}
                          placeholder="Select Role"
                          isSearchable
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.position || '-'}</div>
                      {employee.department && (
                        <div className="text-sm text-gray-500">{employee.department}</div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(employee.salary)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(employee._id, !employee.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(employee.hireDate)}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="grid grid-cols-2 gap-1 w-fit ml-auto">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Edit employee"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <Link
                          href={`/dashboard/employees/${employee._id}/activity`}
                          target="_blank"
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                          title="View activity log"
                        >
                          <FiActivity className="w-4 h-4" />
                          <span>Activity</span>
                        </Link>
                        <button
                          onClick={() => handleViewSalary(employee._id)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                          title="View salary details"
                        >
                          <FiDollarSign className="w-4 h-4" />
                          <span>Salary</span>
                        </button>
                        <button
                          onClick={() => handleViewAttendance(employee._id)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          title="View attendance"
                        >
                          <FiCalendar className="w-4 h-4" />
                          <span>Attend</span>
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors col-span-2"
                          title="Delete employee"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
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
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredEmployees.length === 0 ? 0 : indexOfFirst + 1}</span> to{' '}
          <span className="font-medium">{Math.min(indexOfLast, filteredEmployees.length)}</span> of{' '}
          <span className="font-medium">{filteredEmployees.length}</span> employees
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${
                page === currentPage
                  ? 'bg-[#dc2626] text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="12345-1234567-1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="e.g., Sales Manager"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Sales"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Select
                    value={roleOptions.find(opt => opt.value === formData.role) || null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, role: selected?.value || '' }));
                    }}
                    options={roleOptions}
                    styles={getSelectStyles(roles)}
                    placeholder="Select Role"
                    isSearchable
                    isClearable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#dc2626] rounded-md hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
