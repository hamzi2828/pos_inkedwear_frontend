"use client";
import React from "react";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiStar } from "react-icons/fi";
import { Product } from "../AllProducts";
import { getCurrencySymbol } from "@/helper/helper";

interface ProductCardProps {
  product: Product;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, newStatus: 'published' | 'draft') => Promise<void>;
  onToggleFeatured?: (id: string) => void;
  togglingStatus: Set<string>;
  handleToggleStatus: (productId: string, currentStatus: 'published' | 'draft' | 'out_of_stock') => Promise<void>;
  currency?: string;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  togglingStatus,
  handleToggleStatus,
  currency = 'USD'
}: ProductCardProps) {
  const currencySymbol = getCurrencySymbol(currency);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "out_of_stock":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: string) =>
    status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Product Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10">
            {product.productType === "variant" ? (
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center">
                <span className="text-xs font-bold text-[#dc2626]">{product.variants?.length || 0}</span>
              </div>
            ) : (
              <Image
                className="h-10 w-10 rounded-md object-cover border border-gray-200"
                src={(product.thumbnailUrl || product.bannerUrls?.[0] || product.image || "/images/logo.png").startsWith('/')
                  ? `http://localhost:3001${product.thumbnailUrl || product.bannerUrls?.[0] || product.image || "/images/logo.png"}`
                  : (product.thumbnailUrl || product.bannerUrls?.[0] || product.image || "/images/logo.png")}
                alt={product.name}
                width={40}
                height={40}
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={product.name}>
                {product.name}
              </p>
              {product.featured && (
                <FiStar className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            {product.slug && (
              <p className="text-xs text-gray-400 truncate max-w-[180px]">/{product.slug}</p>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-3 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          product.productType === "variant"
            ? "bg-red-50 text-[#dc2626]"
            : "bg-gray-100 text-gray-600"
        }`}>
          {product.productType === "variant" ? `${product.variants?.length || 0} variants` : "Single"}
        </span>
      </td>

      {/* Category */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-600">{product.category}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
          {formatStatus(product.status)}
        </span>
      </td>

      {/* Price */}
      <td className="px-3 py-3">
        {product.productType === "variant" && product.variants && product.variants.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currencySymbol}{Math.min(...product.variants.map(v => v.price)).toFixed(0)} - {currencySymbol}{Math.max(...product.variants.map(v => v.price)).toFixed(0)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-900">{currencySymbol}{product.price.toFixed(2)}</p>
            {product.discountedPrice && product.discountedPrice < product.price && (
              <p className="text-xs text-green-600">{currencySymbol}{product.discountedPrice.toFixed(2)}</p>
            )}
          </div>
        )}
      </td>

      {/* Cost Price */}
      <td className="px-3 py-3">
        <p className="text-sm text-gray-600">
          {product.costPrice != null ? `${currencySymbol}${product.costPrice.toFixed(2)}` : '—'}
        </p>
      </td>

      {/* Stock */}
      <td className="px-3 py-3">
        <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
          {product.stock}
        </span>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="ml-1 text-xs text-red-500">Low</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {/* Status Toggle */}
          {onToggleStatus && product.status !== 'out_of_stock' && (
            <button
              onClick={() => handleToggleStatus(product.id, product.status)}
              disabled={togglingStatus.has(product.id)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                ${product.status === 'published' ? 'bg-green-500' : 'bg-gray-300'}
                ${togglingStatus.has(product.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`Click to ${product.status === 'published' ? 'unpublish' : 'publish'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                ${product.status === 'published' ? 'translate-x-5' : 'translate-x-0.5'}
              `} />
            </button>
          )}

          {/* Featured Toggle */}
          <button
            title={product.featured ? "Remove from featured" : "Make featured"}
            onClick={() => onToggleFeatured?.(product.id)}
            className={`p-1.5 rounded hover:bg-gray-100 ${product.featured ? "text-yellow-500" : "text-gray-400"}`}
          >
            <FiStar className={`h-4 w-4 ${product.featured ? 'fill-current' : ''}`} />
          </button>

          {/* Edit Button */}
          <button
            className="p-1.5 rounded text-gray-500 hover:text-[#dc2626] hover:bg-red-50"
            onClick={() => onEdit?.(product.id)}
            title="Edit product"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete?.(product.id)}
            title="Delete product"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
