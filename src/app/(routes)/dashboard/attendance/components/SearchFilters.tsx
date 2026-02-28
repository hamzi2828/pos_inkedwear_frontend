'use client';

import { FiSearch } from 'react-icons/fi';
import type { User } from '../../users/types';

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  employees: User[];
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
};

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  statusFilter,
  onStatusFilterChange,
  employees,
  employeeFilter,
  onEmployeeFilterChange,
}: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by employee..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
          />
        </div>

        {/* Employee Filter */}
        <select
          value={employeeFilter}
          onChange={(e) => onEmployeeFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
        >
          <option value="all">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
            placeholder="From date"
          />
        </div>

        {/* Date To */}
        <div>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
            placeholder="To date"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </div>
    </div>
  );
}
