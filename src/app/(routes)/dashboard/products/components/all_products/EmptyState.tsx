"use client";
import React from "react";
import { FiPackage } from "react-icons/fi";

interface EmptyStateProps {
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  onClearFilters: () => void;
}

export default function EmptyState({
  searchQuery,
  statusFilter,
  categoryFilter,
  onClearFilters
}: EmptyStateProps) {
  const hasFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <tr>
      <td colSpan={7} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center">
          <FiPackage className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-sm text-gray-500">
            {hasFilters
              ? "Try adjusting your search criteria or filters."
              : "Get started by creating your first product."}
          </p>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="mt-2 text-[#dc2626] hover:text-red-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}