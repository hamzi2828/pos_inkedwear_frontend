"use client";
import React, { useState, useEffect } from "react";
import ProductForm from "./ProductForm";
import type { Product } from "./AllProducts";
import type { Category } from "./CategoriesTab";
import { productService } from "../services/productService";

interface VendorOption {
  _id: string;
  name: string;
}

interface EditProductProps {
  productId: string;
  categories: Category[];
  vendors: VendorOption[];
  colorOptions: string[];
  sizeOptions: string[];
  onManageAttributes?: () => void;
  onCancel: () => void;
  onSuccess: () => void;
  currency?: string;
}

export default function EditProduct({
  productId,
  categories,
  vendors,
  colorOptions,
  sizeOptions,
  onManageAttributes,
  onCancel,
  onSuccess,
  currency = 'Rs'
}: EditProductProps) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);
        onCancel();
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, onCancel]);

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <p className="text-red-600">Product not found</p>
            <button
              onClick={onCancel}
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      initialData={product}
      categories={categories}
      vendors={vendors}
      colorOptions={colorOptions}
      sizeOptions={sizeOptions}
      onCancel={onCancel}
      onSuccess={onSuccess}
      onManageAttributes={onManageAttributes}
      currency={currency}
    />
  );
}
