'use client';

import { FiSearch } from 'react-icons/fi';
import { MONTHS } from '../types';

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
};

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  monthFilter,
  onMonthFilterChange,
  yearFilter,
  onYearFilterChange,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
          />
        </div>

        {/* Month Filter */}
        <select
          value={monthFilter}
          onChange={(e) => onMonthFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
        >
          <option value="all">All Months</option>
          {MONTHS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => onYearFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>
    </div>
  );
}
