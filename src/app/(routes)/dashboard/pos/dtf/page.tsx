'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Printer } from 'lucide-react';
import DTFOrderPage from './components/DTFOrderPage';

export default function DTFPage() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-auto">
      {/* Header with Mode Toggle */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => router.push('/dashboard/pos')}
              className="px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ShoppingCart className="h-4 w-4" />
              Retail
            </button>
            <button
              className="px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 bg-white text-[#dc2626] shadow-sm"
            >
              <Printer className="h-4 w-4" />
              DTF Printing
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <DTFOrderPage />
      </div>
    </div>
  );
}
