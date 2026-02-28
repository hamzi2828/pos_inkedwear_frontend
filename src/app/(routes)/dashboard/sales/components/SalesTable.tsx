// Sales Table Component
'use client';

import { Receipt, Clock, Eye, Image, Printer, Trash2 } from 'lucide-react';
import { SalesOrder } from '../types';
import { getCurrencySymbol } from '@/helper/helper';

interface SalesTableProps {
  orders: SalesOrder[];
  loading?: boolean;
  onPrintReceipt: (order: SalesOrder) => void;
  onViewInvoice: (order: SalesOrder) => void;
  onDeleteOrder?: (order: SalesOrder) => void;
  currency?: string;
  selectedOrders?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function SalesTable({
  orders,
  loading,
  onPrintReceipt,
  onViewInvoice,
  onDeleteOrder,
  currency = 'PKR',
  selectedOrders = [],
  onSelectionChange,
}: SalesTableProps) {
  const symbol = getCurrencySymbol(currency);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentBadge = (method: string) => {
    const badges: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      split: 'bg-purple-100 text-purple-800',
      bank_transfer: 'bg-orange-100 text-orange-800',
    };
    return badges[method] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatPaymentMethod = (method: string) => {
    if (method === 'bank_transfer') return 'BANK';
    return method.toUpperCase();
  };


  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const isPartialSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map((o) => o._id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    if (!onSelectionChange) return;
    if (selectedOrders.includes(orderId)) {
      onSelectionChange(selectedOrders.filter((id) => id !== orderId));
    } else {
      onSelectionChange([...selectedOrders, orderId]);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="text-center py-12 text-gray-500">
          <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No sales found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {onSelectionChange && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartialSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order #</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date & Time</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Items</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Payment</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Total</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order._id}
                className={`hover:bg-gray-50 ${
                  selectedOrders.includes(order._id) ? 'bg-blue-50' : ''
                }`}
              >
                {onSelectionChange && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{order.orderNumber}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {order.customer ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      {order.customer.email && (
                        <div className="text-xs text-gray-500">{order.customer.email}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Walk-in</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{order.items.length} item(s)</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentBadge(
                      order.paymentMethod
                    )}`}
                  >
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentStatusBadge(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus === 'partial' ? 'PARTIAL' :
                       order.paymentStatus === 'pending' ? 'PENDING' :
                       order.paymentStatus === 'refunded' ? 'REFUNDED' : 'PAID'}
                    </span>
                    {(order.paymentStatus === 'partial' || order.paymentStatus === 'pending') && order.pendingAmount && (
                      <span className="text-xs text-red-600">
                        Due: {symbol}{order.pendingAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">
                      {symbol}
                      {order.total.toFixed(2)}
                    </span>
                    {(order.paymentStatus === 'partial' || order.paymentStatus === 'pending') && order.paidAmount !== undefined && (
                      <span className="text-xs text-green-600">
                        Paid: {symbol}{order.paidAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {order.paymentMethod === 'bank_transfer' && order.bankTransferScreenshot && (
                      <button
                        onClick={() => window.open(order.bankTransferScreenshot, '_blank')}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Bank Transfer Screenshot"
                      >
                        <Image className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onPrintReceipt(order)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Print Receipt"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onViewInvoice(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onDeleteOrder && (
                      <button
                        onClick={() => onDeleteOrder(order)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
