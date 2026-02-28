'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateProduct from '../components/CreateProduct';
import { type Category } from '../components/CategoriesTab';
import { loadCreateTabData } from '../services/productOptionsService';
import { settingsService } from '../../settings/services/settingsService';
import { vendorService } from '../../vendors/service/vendorService';

interface VendorOption {
  _id: string;
  name: string;
}

const CreateProductPage = () => {
  const router = useRouter();

  // Categories and options state
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>('Rs');

  // Load settings for currency
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
    loadSettings();
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

  // Load data for create form
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load categories and options
        const { categories: cats, colorOptions: co, sizeOptions: so } = await loadCreateTabData();
        setCategories(cats as unknown as Category[]);
        setColorOptions(co);
        setSizeOptions(so);

        // Load vendors
        try {
          const vendorsData = await vendorService.getVendors();
          const activeVendors = (Array.isArray(vendorsData) ? vendorsData : [])
            .filter((v: { isActive?: boolean }) => v.isActive !== false)
            .map((v: { _id: string; name: string }) => ({
              _id: String(v._id),
              name: String(v.name),
            }));
          setVendors(activeVendors);
        } catch (err) {
          console.error('Failed to load vendors:', err);
          setVendors([]);
        }
      } catch (e) {
        console.error('Failed to load Create tab data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

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

      <CreateProduct
        categories={categories.filter((c) => c.active)}
        vendors={vendors}
        colorOptions={colorOptions}
        sizeOptions={sizeOptions}
        onManageAttributes={() => router.push('/dashboard/products/attributes')}
        onSuccess={() => {
          showToast('Product created successfully', 'success');
          setTimeout(() => router.push('/dashboard/products'), 1000);
        }}
        currency={currency}
      />
    </>
  );
};

export default CreateProductPage;
