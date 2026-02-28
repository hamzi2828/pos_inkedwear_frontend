'use client';

import { FiPlus } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';
import ProductsNav from './components/ProductsNav';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isCategories = pathname === '/dashboard/products/categories';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your product inventory</p>
        </div>
        {isCategories ? (
          <button
            onClick={() => router.push('/dashboard/products/categories/create')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-[#dc2626] hover:bg-red-700 transition-colors"
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add Category
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard/products/create')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-[#dc2626] hover:bg-red-700 transition-colors"
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      <ProductsNav />

      {children}
    </div>
  );
}
