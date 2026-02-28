'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CategoriesTab, { type Category, type CategoryWithCount } from '../components/CategoriesTab';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { type Product } from '../components/AllProducts';

const CategoriesPage = () => {
  const router = useRouter();

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Products for count calculation
  const [products, setProducts] = useState<Product[]>([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const list = await categoryService.listCategories();
        setCategories(list as unknown as Category[]);
      } catch (e) {
        console.error('Failed to load categories', e);
        setCatError('Could not fetch categories from server.');
      } finally {
        setCatLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Load products for counts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const list = await productService.listProducts();
        setProducts(list as unknown as Product[]);
      } catch (e) {
        console.error('Failed to load products for counts', e);
      }
    };
    loadProducts();
  }, []);

  // Listen for openCreateCategory event from layout
  useEffect(() => {
    const handleOpenCreate = () => {
      router.push('/dashboard/products/categories/create');
    };
    window.addEventListener('openCreateCategory', handleOpenCreate);
    return () => window.removeEventListener('openCreateCategory', handleOpenCreate);
  }, [router]);

  const categoriesWithCount: CategoryWithCount[] = useMemo(
    () =>
      categories.map((cat) => {
        const categoryProducts = products.filter((p) => p.category === cat.name);
        const activeCount = categoryProducts.filter(p => p.status === 'published').length;
        const inactiveCount = categoryProducts.filter(p => p.status === 'draft').length;
        return {
          ...cat,
          count: categoryProducts.length,
          activeCount,
          inactiveCount,
        };
      }),
    [categories, products]
  );

  const openEditCategory = (id: string) => {
    router.push(`/dashboard/products/categories/edit/${id}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/dashboard/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleDeleteCategory = async (id: string) => {
    const prev = categories;
    setCategories((p) => p.filter((c) => c.id !== id));
    try {
      await categoryService.deleteCategory(id);
    } catch (e) {
      console.error('Failed to delete category', e);
      setCategories(prev);
      alert('Failed to delete category');
    }
  };

  const handleToggleActiveCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const nextActive = !target.active;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: nextActive } : c)));
    try {
      await categoryService.setActive(id, nextActive);
    } catch (e) {
      console.error('Failed to update category status', e);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !nextActive } : c)));
      alert('Failed to update category');
    }
  };

  const handleToggleFeaturedCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const nextFeatured = !target.featured;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, featured: nextFeatured } : c)));
    try {
      await categoryService.setFeatured(id, nextFeatured);
    } catch (e) {
      console.error('Failed to update category featured status', e);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, featured: !nextFeatured } : c)));
      alert('Failed to update category featured status');
    }
  };

  return (
    <div className="space-y-6">
      {catError && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
            <p className="text-sm text-red-700 mt-1">{catError}</p>
          </div>
        </div>
      )}

      {catLoading ? (
        <div className="space-y-6">
          {/* Loading skeleton for stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-200 rounded-lg w-9 h-9" />
                  <div className="space-y-2">
                    <div className="h-6 w-12 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Loading skeleton for search bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="flex gap-4 items-center justify-between">
              <div className="h-10 bg-gray-200 rounded-lg flex-1 max-w-md" />
              <div className="h-10 w-24 bg-gray-200 rounded-lg" />
            </div>
          </div>
          {/* Loading skeleton for cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="pt-3 border-t border-gray-100 flex gap-2">
                    <div className="h-12 bg-gray-100 rounded flex-1" />
                    <div className="h-12 bg-gray-100 rounded w-16" />
                    <div className="h-12 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CategoriesTab
          categories={categoriesWithCount}
          onEdit={openEditCategory}
          onDelete={handleDeleteCategory}
          onToggleActive={handleToggleActiveCategory}
          onToggleFeatured={handleToggleFeaturedCategory}
          onCategoryClick={handleCategoryClick}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
