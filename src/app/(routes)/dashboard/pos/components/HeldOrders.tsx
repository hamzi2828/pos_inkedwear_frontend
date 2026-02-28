// Held Orders Component
'use client';

import { HeldCart } from '../types';
import { Archive, Trash2, Clock } from 'lucide-react';
import { getCurrencySymbol } from '@/helper/helper';

interface HeldOrdersProps {
  heldCarts: HeldCart[];
  onRetrieve: (cartId: string) => void;
  onDelete: (cartId: string) => void;
  currency?: string;
}

export default function HeldOrders({
  heldCarts,
  onRetrieve,
  onDelete,
  currency = 'PKR',
}: HeldOrdersProps) {
  const symbol = getCurrencySymbol(currency);
  if (heldCarts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Archive className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No held orders</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {heldCarts.map((held) => (
        <div
          key={held.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-900">
                {held.customerName || 'Walk-in Customer'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(held.heldAt)}</span>
                <span>•</span>
                <span>{held.cart.items.length} item(s)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {symbol}{held.cart.total.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onRetrieve(held.id)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retrieve
            </button>
            <button
              onClick={() => onDelete(held.id)}
              className="bg-red-100 text-red-600 py-2 px-3 rounded hover:bg-red-200 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
