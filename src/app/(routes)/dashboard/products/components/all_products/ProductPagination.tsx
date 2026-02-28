"use client";
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  filteredCount: number;
  indexOfFirstProduct: number;
  indexOfLastProduct: number;
}

export default function ProductPagination({
  currentPage,
  totalPages,
  setCurrentPage,
  filteredCount,
  indexOfFirstProduct,
  indexOfLastProduct
}: ProductPaginationProps) {
  if (filteredCount === 0) return null;

  // Show max 5 page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{indexOfFirstProduct + 1}</span> to{" "}
        <span className="font-medium text-gray-700">{Math.min(indexOfLastProduct, filteredCount)}</span> of{" "}
        <span className="font-medium text-gray-700">{filteredCount}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-[#dc2626] text-white"
                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
