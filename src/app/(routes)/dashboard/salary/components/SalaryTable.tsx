'use client';

import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import type { Salary } from '../types';

type Props = {
  salaries: Salary[];
  onDelete: (salaryId: string) => void;
  formatCurrency: (amount: number) => string;
};

export default function SalaryTable({ salaries, onDelete, formatCurrency }: Props) {
  const getStatusBadgeClass = (status: Salary['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Salary['status']) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Employee
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Month/Year
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Base Salary
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Paid
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Remaining
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {salaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No salary records found.
                </td>
              </tr>
            ) : (
              salaries.map((salary) => (
                <tr key={salary._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 text-white bg-[#dc2626] rounded-full">
                          {salary.employee?.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {salary.employee?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {salary.employee?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {salary.month} {salary.year}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(salary.baseSalary)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(salary.totalPaid)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600 font-medium">
                      {formatCurrency(salary.remainingBalance)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        salary.status
                      )}`}
                    >
                      {getStatusLabel(salary.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/salary/${salary._id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <FiEye className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/dashboard/salary/edit/${salary._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit salary"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => onDelete(salary._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete salary"
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
