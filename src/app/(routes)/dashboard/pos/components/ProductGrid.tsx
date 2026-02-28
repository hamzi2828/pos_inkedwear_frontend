// Product Grid Component - Category-first view
'use client';

import { useState, useEffect, useMemo } from 'react';
import { POSProduct } from '../types';
import ProductCard from './ProductCard';
import { LayoutGrid, ChevronLeft, Package } from 'lucide-react';

interface ProductGridProps {
  products: POSProduct[];
  onSelectProduct: (product: POSProduct) => void;
  loading?: boolean;
  currency?: string;
  searchQuery?: string;
}

export default function ProductGrid({
  products,
  onSelectProduct,
  loading = false,
  currency = 'PKR',
  searchQuery = '',
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Reset to categories view when search query changes
  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory(null);
    }
  }, [searchQuery]);

  // Group products by category
  const categories = useMemo(() => {
    const map = new Map<string, POSProduct[]>();
    for (const product of products) {
      const cat = product.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(product);
    }
    return Array.from(map.entries())
      .map(([name, items]) => ({ name, count: items.length, products: items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = selectedCategory === '__all__'
    ? products
    : selectedCategory
      ? products.filter(p => (p.category || 'Uncategorized') === selectedCategory)
      : [];

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-40" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  // If user is searching, show flat product grid (no category grouping)
  if (searchQuery) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onSelect={onSelectProduct}
            currency={currency}
          />
        ))}
      </div>
    );
  }

  // Category products view
  if (selectedCategory) {
    return (
      <div>
        {/* Back button + category header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedCategory}</h2>
            <p className="text-xs text-gray-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onSelect={onSelectProduct}
              currency={currency}
            />
          ))}
        </div>
      </div>
    );
  }

  // Categories view
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <span className="text-sm text-gray-400">({categories.length})</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* All Products tile */}
        <button
          onClick={() => setSelectedCategory('__all__')}
          className="bg-gradient-to-br from-[#dc2626] to-[#b91c1c] rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">All Products</h3>
          <p className="text-white/70 text-xs mt-1">{products.length} items</p>
        </button>

        {/* Category tiles */}
        {categories.map((cat) => {
          // Get first product thumbnail for the category
          const firstProduct = cat.products.find(p => p.thumbnailUrl);
          const thumbnail = firstProduct?.thumbnailUrl;

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:border-[#dc2626] hover:scale-[1.02] group relative overflow-hidden"
            >
              {/* Category thumbnail */}
              {thumbnail ? (
                <div className="w-12 h-12 rounded-lg mb-3 overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <LayoutGrid className="h-6 w-6 text-gray-400 group-hover:text-[#dc2626] transition-colors" />
                </div>
              )}
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#dc2626] transition-colors">
                {cat.name}
              </h3>
              <p className="text-gray-500 text-xs mt-1">{cat.count} item{cat.count !== 1 ? 's' : ''}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
