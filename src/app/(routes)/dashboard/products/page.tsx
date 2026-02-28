'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AllProducts, { type Product } from './components/AllProducts';
import { productService } from './services/productService';
import { settingsService } from '../settings/services/settingsService';
import { vendorService } from '../vendors/service/vendorService';

interface Vendor {
  _id: string;
  name: string;
}

const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || undefined;

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Load settings for currency and vendors
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.currency) {
          setCurrency(settings.currency);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    const loadVendors = async () => {
      try {
        const vendorList = await vendorService.getVendors();
        setVendors(vendorList);
      } catch (error) {
        console.error('Failed to load vendors:', error);
      }
    };
    loadSettings();
    loadVendors();
  }, []);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    msg: '',
    type: 'success',
  });
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type }), 2500);
  };

  // Loader to fetch products
  const loadProducts = useCallback(async () => {
    setProdLoading(true);
    setProdError(null);
    try {
      const list = await productService.listProducts();
      setProducts(list as unknown as Product[]);
    } catch (e) {
      console.error('Failed to load products', e);
      setProdError('Could not fetch products from server.');
    } finally {
      setProdLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Edit product handler - navigate to edit page
  const handleEditProduct = (id: string) => {
    router.push(`/dashboard/products/edit/${id}`);
  };

  // Delete product with confirm, optimistic UI, and refetch
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    try {
      await productService.deleteProduct(id);
      await loadProducts();
      showToast('Product deleted successfully', 'success');
    } catch (e) {
      console.error('Failed to delete product', e);
      setProducts(prev);
      showToast('Failed to delete product', 'error');
      alert('Failed to delete product');
    }
  };

  // Toggle product status handler
  const handleToggleProductStatus = async (id: string, newStatus: 'published' | 'draft') => {
    const prev = products;
    setProducts((p) => p.map((x) => x.id === id ? { ...x, status: newStatus } : x));
    try {
      await productService.toggleProductStatus(id, newStatus);
      showToast(`Product ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`, 'success');
    } catch (e) {
      console.error('Failed to toggle product status', e);
      setProducts(prev);
      showToast('Failed to update product status', 'error');
    }
  };

  // Toggle product featured handler
  const handleToggleFeaturedProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextFeatured = !target.featured;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, featured: nextFeatured } : p)));
    try {
      await productService.toggleFeatured(id, nextFeatured);
      showToast(`Product ${nextFeatured ? 'marked as featured' : 'removed from featured'} successfully`, 'success');
    } catch (e) {
      console.error('Failed to toggle product featured status', e);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, featured: !nextFeatured } : p)));
      showToast('Failed to update product featured status', 'error');
    }
  };

  return (
    <>
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow ${
            toast.type === 'success'
              ? 'bg-green-50 text-gray-800 border-l-4 border-green-400'
              : toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-center">
            <span className="font-medium">{toast.msg}</span>
            <button onClick={() => setToast({ show: false, msg: '', type: toast.type })} className="ml-3 text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </div>
      )}

      <AllProducts
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggleStatus={handleToggleProductStatus}
        onToggleFeatured={handleToggleFeaturedProduct}
        loading={prodLoading}
        error={prodError}
        currency={currency}
        initialCategory={initialCategory}
        vendors={vendors}
      />
    </>
  );
};

export default ProductsPage;
