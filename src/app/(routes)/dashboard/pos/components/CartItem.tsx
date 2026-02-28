// Cart Item Component
'use client';

import { CartItem as CartItemType } from '../types';
import { Minus, Plus, X, Wrench } from 'lucide-react';
import { getColorThumbnail, getProductThumbnail } from '../utils/imageHelper';
import { getCurrencySymbol } from '@/helper/helper';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  currency?: string;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  currency = 'PKR',
}: CartItemProps) {
  const symbol = getCurrencySymbol(currency);
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.isLabour) {
      onUpdateQuantity(item.id, item.quantity + 1);
      return;
    }
    const maxStock = item.variant ? item.variant.stock : item.product.stock;
    if (item.quantity < maxStock) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const thumbnail = item.color
    ? getColorThumbnail(item.product, item.color)
    : getProductThumbnail(item.product);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-200">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
        {item.isLabour ? (
          <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500">
            <Wrench className="h-6 w-6" />
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
          {item.product.name}
        </h4>
        {(item.color || item.size) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.color && item.size
              ? `${item.color} / ${item.size}`
              : item.color || item.size}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrease}
              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium w-8 text-center">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {symbol}{item.subtotal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {symbol}{item.unitPrice.toFixed(2)} each
            </div>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.id)}
        className="text-gray-400 hover:text-red-500 p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
