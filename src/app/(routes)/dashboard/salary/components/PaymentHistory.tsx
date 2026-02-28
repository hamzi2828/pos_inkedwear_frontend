'use client';

import { FiTrash2 } from 'react-icons/fi';
import type { Payment } from '../types';

type Props = {
  payments: Payment[];
  onDeletePayment: (paymentId: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
};

export default function PaymentHistory({
  payments,
  onDeletePayment,
  formatCurrency,
  formatDate,
}: Props) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        <p className="text-gray-500 text-center py-4">No payments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Notes
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(payment.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.notes || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <button
                    onClick={() => onDeletePayment(payment._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete payment"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
