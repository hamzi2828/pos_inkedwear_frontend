"use client";
import React, { useMemo } from "react";
import { FiDollarSign, FiTrendingUp, FiPackage, FiBarChart2 } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { Product } from "../AllProducts";
import { getCurrencySymbol } from "@/helper/helper";

interface InventoryValueSummaryProps {
  products: Product[];
  filteredProducts: Product[];
  categoryFilter: string;
  currency?: string;
}

interface InventoryTotals {
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  totalItems: number;
  profitMargin: number;
}

function calculateInventoryTotals(products: Product[]): InventoryTotals {
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let totalItems = 0;

  products.forEach((product) => {
    if (product.productType === "variant" && product.variants && product.variants.length > 0) {
      // For variant products, calculate based on each variant's stock and price
      product.variants.forEach((variant) => {
        const variantStock = variant.stock || 0;
        const variantPrice = variant.discountedPrice || variant.price || 0;
        // Use product's cost price as base for variants (or 0 if not set)
        const variantCostPrice = product.costPrice || 0;

        totalItems += variantStock;
        totalRetailValue += variantPrice * variantStock;
        totalCostValue += variantCostPrice * variantStock;
      });
    } else {
      // For single products
      const stock = product.stock || 0;
      const price = product.discountedPrice || product.price || 0;
      const costPrice = product.costPrice || 0;

      totalItems += stock;
      totalRetailValue += price * stock;
      totalCostValue += costPrice * stock;
    }
  });

  const potentialProfit = totalRetailValue - totalCostValue;
  const profitMargin = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

  return {
    totalCostValue,
    totalRetailValue,
    potentialProfit,
    totalItems,
    profitMargin,
  };
}

function formatCurrencyValue(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  if (currency === "PKR") {
    return `${symbol}${value.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCurrencyIcon(currency: string) {
  if (currency === "PKR" || currency === "INR") {
    return TbCurrencyRupee;
  }
  return FiDollarSign;
}

export default function InventoryValueSummary({
  products,
  filteredProducts,
  categoryFilter,
  currency = "PKR",
}: InventoryValueSummaryProps) {
  // Calculate totals for all products
  const allTotals = useMemo(() => calculateInventoryTotals(products), [products]);

  // Calculate totals for filtered products (based on category/search)
  const filteredTotals = useMemo(() => calculateInventoryTotals(filteredProducts), [filteredProducts]);

  // Determine which totals to display prominently
  const isFiltered = categoryFilter !== "all" || filteredProducts.length !== products.length;
  const displayTotals = filteredTotals;

  const CurrencyIcon = getCurrencyIcon(currency);

  const summaryCards = [
    {
      label: "Total Cost Value",
      value: formatCurrencyValue(displayTotals.totalCostValue, currency),
      icon: FiBarChart2,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      description: "Investment in inventory",
    },
    {
      label: "Total Retail Value",
      value: formatCurrencyValue(displayTotals.totalRetailValue, currency),
      icon: FiTrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      description: "Value at sale price",
    },
    {
      label: "Potential Profit",
      value: formatCurrencyValue(displayTotals.potentialProfit, currency),
      icon: FiTrendingUp,
      color: displayTotals.potentialProfit >= 0 ? "text-green-600" : "text-red-600",
      bg: displayTotals.potentialProfit >= 0 ? "bg-green-50" : "bg-red-50",
      border: displayTotals.potentialProfit >= 0 ? "border-green-200" : "border-red-200",
      description: `${displayTotals.profitMargin.toFixed(1)}% margin`,
    },
    {
      label: "Total Stock Units",
      value: displayTotals.totalItems.toLocaleString(),
      icon: FiPackage,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      description: `${filteredProducts.length} products`,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Inventory Value Summary</h3>
          <p className="text-xs text-gray-500">
            {isFiltered ? (
              <>
                Showing totals for{" "}
                <span className="font-medium text-blue-600">
                  {categoryFilter !== "all" ? categoryFilter : `${filteredProducts.length} filtered products`}
                </span>
              </>
            ) : (
              "Showing totals for all inventory"
            )}
          </p>
        </div>
        {isFiltered && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Overall inventory</p>
            <p className="text-xs font-medium text-gray-600">
              Cost: {formatCurrencyValue(allTotals.totalCostValue, currency)} | Retail: {formatCurrencyValue(allTotals.totalRetailValue, currency)}
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-lg p-3 transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs font-medium text-gray-600">{card.label}</span>
            </div>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
