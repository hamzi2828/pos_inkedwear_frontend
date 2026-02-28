"use client";
import React from "react";
import ProductForm from "./ProductForm";
import type { Category } from "./CategoriesTab";

interface VendorOption {
  _id: string;
  name: string;
}

interface CreateProductProps {
  categories: Category[];
  vendors: VendorOption[];
  colorOptions: string[];
  sizeOptions: string[];
  onManageAttributes?: () => void;
  onSuccess?: () => void;
  currency?: string;
}

export default function CreateProduct({
  categories,
  vendors,
  colorOptions,
  sizeOptions,
  onManageAttributes,
  onSuccess,
  currency = 'Rs'
}: CreateProductProps) {
  return (
    <ProductForm
      mode="create"
      categories={categories}
      vendors={vendors}
      colorOptions={colorOptions}
      sizeOptions={sizeOptions}
      onManageAttributes={onManageAttributes}
      onSuccess={onSuccess}
      currency={currency}
    />
  );
}
