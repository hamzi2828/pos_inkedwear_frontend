"use client";
import React from "react";
import { FiPackage, FiStar, FiCheckCircle, FiEdit3, FiLayers } from "react-icons/fi";
import { Product } from "../AllProducts";

type FilterType = "all" | "published" | "draft" | "variants" | "featured";

interface ProductStatsProps {
  products: Product[];
  filteredCount: number;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function ProductStats({ products, filteredCount, activeFilter, onFilterChange }: ProductStatsProps) {
  const publishedCount = products.filter(p => p.status === 'published').length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const variantCount = products.filter(p => p.productType === 'variant').length;
  const featuredCount = products.filter(p => p.featured).length;

  const stats: { label: string; value: number; icon: typeof FiPackage; color: string; bg: string; activeColor: string; filter: FilterType }[] = [
    { label: 'Total', value: products.length, icon: FiPackage, color: 'text-gray-600', bg: 'bg-gray-100', activeColor: 'bg-gray-200 ring-2 ring-gray-400', filter: 'all' },
    { label: 'Published', value: publishedCount, icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50', activeColor: 'bg-green-100 ring-2 ring-green-500', filter: 'published' },
    { label: 'Draft', value: draftCount, icon: FiEdit3, color: 'text-yellow-600', bg: 'bg-yellow-50', activeColor: 'bg-yellow-100 ring-2 ring-yellow-500', filter: 'draft' },
    { label: 'Variants', value: variantCount, icon: FiLayers, color: 'text-[#dc2626]', bg: 'bg-red-50', activeColor: 'bg-red-100 ring-2 ring-[#dc2626]', filter: 'variants' },
    { label: 'Featured', value: featuredCount, icon: FiStar, color: 'text-orange-500', bg: 'bg-orange-50', activeColor: 'bg-orange-100 ring-2 ring-orange-500', filter: 'featured' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map((stat) => (
        <button
          key={stat.label}
          onClick={() => onFilterChange(stat.filter)}
          className={`${activeFilter === stat.filter ? stat.activeColor : stat.bg} rounded-lg px-3 py-2 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer`}
        >
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
          <div className="text-left">
            <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
