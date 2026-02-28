'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showingFrom: number;
  showingTo: number;
  totalCount: number;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showingFrom,
  showingTo,
  totalCount,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{showingFrom}</span> to{' '}
        <span className="font-medium">{showingTo}</span> of{' '}
        <span className="font-medium">{totalCount}</span> roles
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
