'use client';

import { FiSearch } from 'react-icons/fi';

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
};

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search customers by name, email or phone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
        />
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
