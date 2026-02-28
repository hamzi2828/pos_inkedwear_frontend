import React from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  stock: number;
}

interface TopProductsProps {
  products: Product[];
}

export const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Top Products</h2>
        <Link href="/dashboard/products" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                Sales
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                Revenue
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {index + 1}
                      </span>
                      <Link href={`/dashboard/products/${product.id}`} className="ml-3 text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-500 whitespace-nowrap">
                    {product.sales}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium whitespace-nowrap">
                    ${product.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                      {product.stock} units
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};