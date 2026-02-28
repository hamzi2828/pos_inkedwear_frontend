"use client";
import React from "react";
import { FiSearch, FiX } from "react-icons/fi";
import FilterCombobox from "./FilterCombobox";

interface ProductFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  availableCategories: string[];
  vendorFilter: string;
  setVendorFilter: (filter: string) => void;
  availableVendors: { value: string; label: string }[];
  onCurrentPageReset: () => void;
}

export default function ProductFilters({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  availableCategories,
  vendorFilter,
  setVendorFilter,
  availableVendors,
  onCurrentPageReset
}: ProductFiltersProps) {
  const handleSearchChange = (value: string) => {
    onCurrentPageReset();
    setSearchQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    onCurrentPageReset();
  };

  const handleVendorChange = (value: string) => {
    setVendorFilter(value);
    onCurrentPageReset();
  };

  const clearSearch = () => {
    setSearchQuery("");
    onCurrentPageReset();
  };

  // Convert categories to options format
  const categoryOptions = availableCategories.map((category) => ({
    value: category,
    label: category,
  }));

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px] max-w-md">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="search"
            id="search"
            aria-label="Search products"
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm placeholder:text-gray-400 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <FilterCombobox
        value={categoryFilter}
        onChange={handleCategoryChange}
        options={categoryOptions}
        placeholder="Search categories..."
        allOptionLabel="All Categories"
      />

      {/* Vendor Filter */}
      <FilterCombobox
        value={vendorFilter}
        onChange={handleVendorChange}
        options={availableVendors}
        placeholder="Search vendors..."
        allOptionLabel="All Vendors"
      />
    </div>
  );
}
