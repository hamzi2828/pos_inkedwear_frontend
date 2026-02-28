'use client';

import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Car } from 'lucide-react';
import type { Customer, CarDetails } from '../types';

type Props = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onStatusToggle: (customerId: string, isActive: boolean) => void;
  formatDate: (iso: string) => string;
};

export default function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onStatusToggle,
  formatDate,
}: Props) {
  const getFullName = (customer: Customer) => {
    return `${customer.firstName} ${customer.lastName}`.trim();
  };

  // Helper to get cars array
  const getCarsArray = (carDetails: CarDetails | CarDetails[]): CarDetails[] => {
    if (Array.isArray(carDetails)) {
      return carDetails;
    }
    return carDetails ? [carDetails] : [];
  };

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Car Details
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Created
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">
                      {customer.customerCode || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 text-white bg-[#dc2626] rounded-full">
                          {customer.firstName?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getFullName(customer)}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.customerType === 'online'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {customer.customerType === 'online' ? 'Online' : 'Walk-in'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phone || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {(() => {
                      const cars = getCarsArray(customer.carDetails);
                      if (cars.length === 0) {
                        return <div className="text-sm text-gray-500">-</div>;
                      }
                      return (
                        <div className="space-y-1">
                          {cars.map((car, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Car className="h-4 w-4 text-[#dc2626] mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-sm text-gray-900">
                                  {car.brand && car.model ? `${car.brand} ${car.model}` : '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {car.numberPlate || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {customer.address?.city && customer.address?.state
                        ? `${customer.address.city}, ${customer.address.state}`
                        : customer.address?.city || customer.address?.country || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onStatusToggle(customer._id, !customer.isActive)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(customer.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit customer"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(customer._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete customer"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
