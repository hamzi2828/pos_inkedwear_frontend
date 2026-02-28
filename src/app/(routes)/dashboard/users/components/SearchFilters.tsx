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
    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search users..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
