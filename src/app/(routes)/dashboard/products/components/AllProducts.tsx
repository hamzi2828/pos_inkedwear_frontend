"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  ProductStats,
  ProductFilters,
  ProductCard,
  ProductPagination,
  EmptyState,
  LoadingState,
  ErrorState,
  InventoryValueSummary
} from "./all_products";

export interface ProductVariant {
  color: string;
  size: string;
  price: number;
  stock: number;
  sku?: string;
  discountedPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  vendor?: string;
  costPrice?: number;
  price: number;
  discountedPrice?: number;
  stock: number;
  status: "published" | "draft" | "out_of_stock";
  featured?: boolean;
  // Deprecated: kept for backward compatibility
  image?: string;
  // New fields
  thumbnailUrl?: string;
  bannerUrls?: string[];
  // Variants (optional)
  productType?: "single" | "variant";
  variants?: ProductVariant[];
  // Color media for variant products
  colorMedia?: Record<string, {
    thumbnailUrl?: string;
    bannerUrls?: string[];
  }>;
}

type StatFilterType = "all" | "published" | "draft" | "variants" | "featured";

interface Vendor {
  _id: string;
  name: string;
}

interface AllProductsProps {
  products: Product[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, newStatus: 'published' | 'draft') => Promise<void>;
  onToggleFeatured?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  currency?: string;
  initialCategory?: string;
  vendors?: Vendor[];
}

export default function AllProducts({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  loading = false,
  error = null,
  currency = 'USD',
  initialCategory,
  vendors = []
}: AllProductsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statFilter, setStatFilter] = useState<StatFilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all");

  // Update category filter when initialCategory changes (from URL)
  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingStatus, setTogglingStatus] = useState<Set<string>>(new Set());
  const productsPerPage = 10;

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category))).sort();
    return categories;
  }, [products]);

  // Create vendor ID to name map
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach(v => map.set(v._id, v.name));
    return map;
  }, [vendors]);

  // Get unique vendors for filter dropdown
  const availableVendors = useMemo(() => {
    const vendorSet = new Set<string>();
    products.forEach(p => {
      if (p.vendor) vendorSet.add(p.vendor);
    });
    return Array.from(vendorSet)
      .map(vendorId => ({
        value: vendorId,
        label: vendorMap.get(vendorId) || vendorId
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, vendorMap]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.slug?.toLowerCase().includes(searchQuery.toLowerCase());

      // Stat filter logic
      let matchesStat = true;
      switch (statFilter) {
        case "published":
          matchesStat = product.status === "published";
          break;
        case "draft":
          matchesStat = product.status === "draft";
          break;
        case "variants":
          matchesStat = product.productType === "variant";
          break;
        case "featured":
          matchesStat = product.featured === true;
          break;
        case "all":
        default:
          matchesStat = true;
      }

      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesVendor = vendorFilter === "all" || product.vendor === vendorFilter;

      return matchesSearch && matchesStat && matchesCategory && matchesVendor;
    });
  }, [products, searchQuery, statFilter, categoryFilter, vendorFilter]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;

  const handleToggleStatus = async (productId: string, currentStatus: 'published' | 'draft' | 'out_of_stock') => {
    if (!onToggleStatus || currentStatus === 'out_of_stock') return;

    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    setTogglingStatus(prev => new Set([...prev, productId]));

    try {
      await onToggleStatus(productId, newStatus);
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    } finally {
      setTogglingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const resetCurrentPage = () => setCurrentPage(1);

  const handleStatFilterChange = (filter: StatFilterType) => {
    setStatFilter(filter);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatFilter("all");
    setCategoryFilter("all");
    setVendorFilter("all");
    setCurrentPage(1);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-4">
      {/* Category Header Banner (when filtered from categories page) */}
      {initialCategory && categoryFilter !== "all" && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm">Viewing products in</p>
              <h2 className="text-white font-semibold text-lg">{categoryFilter}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              setCategoryFilter("all");
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/dashboard/products');
              }
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            View All Products
          </button>
        </div>
      )}

      {/* Statistics - Clickable for filtering */}
      <ProductStats
        products={products}
        filteredCount={filteredProducts.length}
        activeFilter={statFilter}
        onFilterChange={handleStatFilterChange}
      />

      {/* Inventory Value Summary */}
      <InventoryValueSummary
        products={products}
        filteredProducts={filteredProducts}
        categoryFilter={categoryFilter}
        currency={currency}
      />

      {/* Filters - Search, Category, and Vendor */}
      <ProductFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        availableCategories={availableCategories}
        vendorFilter={vendorFilter}
        setVendorFilter={setVendorFilter}
        availableVendors={availableVendors}
        onCurrentPageReset={resetCurrentPage}
      />

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Price
              </th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onToggleFeatured={onToggleFeatured}
                  togglingStatus={togglingStatus}
                  handleToggleStatus={handleToggleStatus}
                  currency={currency}
                />
              ))
            ) : (
              <EmptyState
                searchQuery={searchQuery}
                statusFilter={statFilter}
                categoryFilter={categoryFilter}
                onClearFilters={handleClearAllFilters}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        filteredCount={filteredProducts.length}
        indexOfFirstProduct={indexOfFirstProduct}
        indexOfLastProduct={indexOfLastProduct}
      />
    </div>
  );
}
