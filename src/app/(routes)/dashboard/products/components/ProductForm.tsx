"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { FiPlus, FiX } from "react-icons/fi";
import type { Product, ProductVariant } from "./AllProducts";
import type { Category } from "./CategoriesTab";
import { slugify, buildVariantCombos, syncVariants, type Variant } from "../services/productCreateService";
import { productService } from "../services/productService";
import { getCurrencySymbol } from "@/helper/helper";

export type ProductFormData = Omit<Product, "id">;

interface VendorOption {
  _id: string;
  name: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Product;
  categories: Category[];
  vendors: VendorOption[];
  colorOptions: string[];
  sizeOptions: string[];
  onSubmit?: (data: ProductFormData) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  onManageAttributes?: () => void;
  currency?: string;
}

interface ColorMediaData {
  thumbnailUrl?: string;
  bannerUrls: string[];
  thumbFile?: File;
  bannerFiles?: File[];
  modified?: boolean;
}

// Helper to validate URLs before passing to Image component
const isValidUrl = (url: string | undefined): url is string => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const initialFormData: ProductFormData = {
  name: "",
  category: "",
  vendor: "",
  costPrice: 0,
  price: 0,
  stock: 0,
  status: "draft",
  thumbnailUrl: "",
  bannerUrls: [],
  productType: "single",
  variants: []
};

export default function ProductForm({
  mode,
  initialData,
  categories,
  vendors,
  colorOptions,
  sizeOptions,
  onSubmit,
  onCancel,
  onSuccess,
  onManageAttributes,
  currency = 'USD'
}: ProductFormProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const [form, setForm] = useState<ProductFormData>(initialData ? {
    ...initialData,
    // Add backend URL prefix to image URLs for display (if not already present)
    thumbnailUrl: initialData.thumbnailUrl
      ? (initialData.thumbnailUrl.startsWith('http')
          ? initialData.thumbnailUrl
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialData.thumbnailUrl}`)
      : initialData.thumbnailUrl,
    bannerUrls: Array.isArray(initialData.bannerUrls)
      ? initialData.bannerUrls.map((url: string) =>
          url.startsWith('http')
            ? url
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`)
      : initialData.bannerUrls
  } : initialFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // File handling state
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  // Removed unused thumbName state
  
  // Variant state
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorMedia, setColorMedia] = useState<Record<string, ColorMediaData>>({});
  
  // Refs
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const colorThumbRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const colorBannerRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  const isVariant = form.productType === "variant";
  const slug = useMemo(() => slugify(form.name), [form.name]);
  
  
  // Helper to clean URL for sending to backend (remove domain, keep relative path)
  const cleanUrlForBackend = (url: string): string => {
    if (!url) return url;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    let cleanUrl = url;
    if (backendUrl && cleanUrl.startsWith(backendUrl)) {
      cleanUrl = cleanUrl.replace(backendUrl, '');
    }
    // Don't add '/' prefix to absolute URLs (http/https)
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  };
  // Helper to resolve URLs from backend (handles absolute URLs and corrupted /https:// URLs)
  const resolveBackendUrl = (url: string, backendUrl: string): string => {
    if (!url) return url;
    // Fix corrupted URLs that have /https:// or /http://
    if (url.startsWith('/https://') || url.startsWith('/http://')) {
      return url.substring(1); // Remove the leading /
    }
    // Don't modify absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Prepend backendUrl to relative URLs
    return backendUrl ? `${backendUrl}${url}` : url;
  };

  // Initialize form data from initialData for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Extract variants information to set selected colors and sizes
      if (initialData.productType === "variant" && initialData.variants) {
        const colors = Array.from(new Set((initialData.variants as ProductVariant[]).map(v => v.color)));
        const sizes = Array.from(new Set((initialData.variants as ProductVariant[]).map(v => v.size)));
        setSelectedColors(colors);
        setSelectedSizes(sizes);

        // Initialize colorMedia from existing product data
        if (initialData.colorMedia && typeof initialData.colorMedia === 'object') {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
          const colorMediaData: Record<string, ColorMediaData> = {};
          Object.entries(initialData.colorMedia).forEach(([color, media]) => {
            if (media && typeof media === 'object') {
              colorMediaData[color] = {
                thumbnailUrl: media.thumbnailUrl ? resolveBackendUrl(media.thumbnailUrl, backendUrl) : undefined,
                bannerUrls: Array.isArray(media.bannerUrls)
                  ? media.bannerUrls.map((url: string) => resolveBackendUrl(url, backendUrl))
                  : [],
                bannerFiles: [], // No files initially since these are existing URLs
                modified: false // Mark as not modified initially
              };
            }
          });
          console.log('Initializing colorMedia for edit mode:', colorMediaData);
          setColorMedia(colorMediaData);
        }
      }
    }
  }, [mode, initialData]);
  
  // Build all color-size combinations
  const variantCombos = useMemo(
    () => buildVariantCombos(selectedColors, selectedSizes),
    [selectedColors, selectedSizes]
  );
  
  // Keep form.variants in sync with selections
  useEffect(() => {
    if (!isVariant) return;

    // In edit mode, protect existing variant data by only syncing when actually needed
    if (mode === "edit" && initialData?.variants && Array.isArray(initialData.variants)) {
      const currentVariants = form.variants || [];

      // If we have no current variants but should have them from initialData,
      // or if variantCombos length is 0 (indicating initialization phase), skip
      if (variantCombos.length === 0 || currentVariants.length === 0) {
        return;
      }

      // Check if current variants match the variant combos exactly
      const hasAllCombos = variantCombos.every(combo =>
        currentVariants.some(v => v.color === combo.color && v.size === combo.size)
      );
      const hasExtraVariants = currentVariants.some(v =>
        !variantCombos.some(combo => combo.color === v.color && combo.size === v.size)
      );

      // Only sync if the combinations don't match (user changed color/size selections)
      if (!hasAllCombos || hasExtraVariants) {
        const next = syncVariants((form.variants || []) as unknown as Variant[], variantCombos);
        if (JSON.stringify(next) !== JSON.stringify(form.variants || [])) {
          setField("variants", next as ProductVariant[]);
        }
      }
    } else if (mode === "create") {
      // For create mode, always sync when combinations change
      const next = syncVariants((form.variants || []) as unknown as Variant[], variantCombos);
      if (JSON.stringify(next) !== JSON.stringify(form.variants || [])) {
        setField("variants", next as ProductVariant[]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantCombos, isVariant, mode]);
  
  const safeRevoke = useCallback((url?: string) => {
    if (url && url.startsWith("blob:")) {
      try { URL.revokeObjectURL(url); } catch {}
    }
  }, []);
  
  const validate = () => {
    const e: Record<string, string> = {};

    // Basic validations
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.vendor) e.vendor = "Vendor is required";
    if (!form.category) e.category = "Category is required";

    if (!isVariant) {
      if (form.costPrice === undefined || form.costPrice === null || form.costPrice < 0) e.costPrice = "Cost Price is required";
      if (!form.price || form.price < 0) e.price = "Price must be a positive number";
      if (form.stock < 0) e.stock = "Stock cannot be negative";
      if (mode === "create" && !thumbFile && !form.thumbnailUrl?.trim()) {
        e.thumbnail = "Thumbnail is required";
      }
    } else {
      if (selectedColors.length === 0) e.colors = "Select at least one color";
      if (selectedSizes.length === 0) e.sizes = "Select at least one size";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (type === "thumbnail") {
      if (form.thumbnailUrl && form.thumbnailUrl.toString().startsWith("blob:")) {
        safeRevoke(form.thumbnailUrl.toString());
      }
      const url = URL.createObjectURL(file);
      setThumbFile(file);
      // Removed setThumbName since it was unused
      setField("thumbnailUrl", url);
      setErrors(prev => ({ ...prev, thumbnail: "" }));
    } else {
      const existing = form.bannerUrls || [];
      if (existing.length >= 10) {
        toast.error("Maximum 10 banner images allowed");
        return;
      }
      const url = URL.createObjectURL(file);
      setField("bannerUrls", [...existing, url]);
      setBannerFiles(prev => [...prev, file]);
    }
  };
  
  const handleMultipleBannerFiles = (files: FileList) => {
    const existing = form.bannerUrls || [];
    const spaceLeft = 5 - existing.length;
    const filesToAdd = Array.from(files).slice(0, spaceLeft);
    
    if (filesToAdd.length < files.length) {
      toast.error(`Only ${spaceLeft} more banner images can be added`);
    }
    
    filesToAdd.forEach(file => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setField("bannerUrls", [...(form.bannerUrls || []), url]);
        setBannerFiles(prev => [...prev, file]);
      }
    });
  };
  
  const removeBanner = (index: number) => {
    const banners = [...(form.bannerUrls || [])];
    const [removed] = banners.splice(index, 1);
    if (removed) safeRevoke(removed.toString());
    setField("bannerUrls", banners);
    setBannerFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleColorThumbFiles = (color: string, files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    
    setColorMedia((prev) => {
      const prevUrl = prev[color]?.thumbnailUrl;
      if (prevUrl && prevUrl.startsWith("blob:")) {
        safeRevoke(prevUrl);
      }
      const url = URL.createObjectURL(file);
      return {
        ...prev,
        [color]: {
          ...prev[color],
          thumbnailUrl: url,
          thumbFile: file,
          bannerUrls: prev[color]?.bannerUrls || [],
          modified: true
        },
      };
    });
  };
  
  const handleColorBannerFiles = (color: string, files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;
    
    setColorMedia((prev) => {
      const curr = prev[color] || { bannerUrls: [], bannerFiles: [] };
      const existing = curr.bannerUrls || [];
      const existingFiles = curr.bannerFiles || [];
      const spaceLeft = 10 - existing.length;
      const toAdd = incoming.slice(0, Math.max(0, spaceLeft));
      const urls = toAdd.map((f) => URL.createObjectURL(f));
      
      return { 
        ...prev, 
        [color]: { 
          ...curr, 
          bannerUrls: [...existing, ...urls],
          bannerFiles: [...existingFiles, ...toAdd],
          modified: true 
        } 
      };
    });
  };
  
  const removeColorBanner = (color: string, index: number) => {
    setColorMedia((prev) => {
      const banners = [...(prev[color]?.bannerUrls || [])];
      const files = [...(prev[color]?.bannerFiles || [])];
      const [removed] = banners.splice(index, 1);
      files.splice(index, 1);
      if (removed) safeRevoke(removed);
      return { 
        ...prev, 
        [color]: { 
          ...prev[color], 
          bannerUrls: banners,
          bannerFiles: files,
          modified: true 
        } 
      };
    });
  };
  
  const clearColorMedia = (color: string) => {
    setColorMedia((prev) => {
      const curr = prev[color];
      if (curr?.thumbnailUrl) safeRevoke(curr.thumbnailUrl);
      (curr?.bannerUrls || []).forEach(safeRevoke);
      return {
        ...prev,
        [color]: { bannerUrls: [], bannerFiles: [], modified: true }
      };
    });
    if (colorThumbRefs.current[color]) colorThumbRefs.current[color]!.value = "";
    if (colorBannerRefs.current[color]) colorBannerRefs.current[color]!.value = "";
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Basic fields
      formData.append("name", form.name);
      formData.append("slug", slug);
      formData.append("vendor", form.vendor || "");
      formData.append("category", form.category);
      formData.append("price", String(form.price ?? 0));
      if (form.costPrice !== undefined && form.costPrice !== null) {
        formData.append("costPrice", String(form.costPrice));
      }
      if (form.discountedPrice !== undefined && form.discountedPrice !== null) {
        formData.append("discountedPrice", String(form.discountedPrice));
      }
      formData.append("stock", String(form.stock ?? 0));
      formData.append("status", form.status);
      formData.append("productType", form.productType || "single");

      if (isVariant && form.variants) {
        // Handle variant products
        const variantStock = form.variants.reduce((sum, v) => sum + (Number((v as ProductVariant).stock) || 0), 0);
        const basePrice = (form.variants[0] as ProductVariant)?.price ?? 0;
        formData.set("stock", String(variantStock));
        formData.set("price", String(basePrice));
        formData.append("variants", JSON.stringify(form.variants));
        
        // Handle color-specific media
        console.log('Processing colorMedia for submission:', colorMedia);
        
        // If no colorMedia exists but we have variants, ensure each color gets processed
        if (Object.keys(colorMedia).length === 0 && selectedColors.length > 0) {
          console.log('No colorMedia found, but have selected colors:', selectedColors);
          // Initialize empty colorMedia for each selected color
          selectedColors.forEach(color => {
            if (!colorMedia[color]) {
              colorMedia[color] = { bannerUrls: [], modified: false };
            }
          });
        }
        
        for (const [color, media] of Object.entries(colorMedia)) {
          console.log(`Processing color ${color}:`, media);
          
          // Always process media in edit mode, regardless of modified status
          if (mode === "edit" || media.modified) {
            // Send new thumbnail file if uploaded
            if (media.thumbFile) {
              const thumbFileName = `${color}_${media.thumbFile.name}`;
              const renamedThumbFile = new File([media.thumbFile], thumbFileName, { type: media.thumbFile.type });
              formData.append("colorThumbnail", renamedThumbFile);
            } else if (media.thumbnailUrl && !media.thumbnailUrl.startsWith('blob:')) {
              // Keep existing thumbnail if no new file uploaded
              const cleanUrl = cleanUrlForBackend(media.thumbnailUrl);
              formData.append("existingColorThumbnails", JSON.stringify({ color, url: cleanUrl }));
            }
            
            // Send new banner files if uploaded
            if (media.bannerFiles && media.bannerFiles.length > 0) {
              media.bannerFiles.forEach((file, index) => {
                const bannerFileName = `${color}_${index}_${file.name}`;
                const renamedBannerFile = new File([file], bannerFileName, { type: file.type });
                formData.append("colorBanner", renamedBannerFile);
              });
            }
            
            // Always send existing banner URLs in edit mode
            const existingBanners = (media.bannerUrls || []).filter(url => 
              typeof url === 'string' && !url.startsWith('blob:')
            );
            if (existingBanners.length > 0) {
              const cleanUrls = existingBanners.map(cleanUrlForBackend);
              formData.append("existingColorBanners", JSON.stringify({ color, urls: cleanUrls }));
            }
          }
        }
      } else {
        // Handle single products
        if (thumbFile) formData.append("thumbnail", thumbFile);
        bannerFiles.forEach((f) => formData.append("banners", f));
      }
      
      // For edit mode, preserve existing images
      if (mode === "edit" && initialData) {
        if (!isVariant) {
          if (!thumbFile && initialData.thumbnailUrl) {
            // Clean the thumbnail URL to get relative path
            const cleanThumbUrl = cleanUrlForBackend(form.thumbnailUrl || initialData.thumbnailUrl);
            formData.append("existingThumbnail", cleanThumbUrl);
          }
          // Send the current banner URLs (which may have been modified by removal)
          // Filter out blob URLs and only keep actual server URLs
          const existingServerBanners = (form.bannerUrls || []).filter(url => 
            typeof url === 'string' && !url.startsWith('blob:')
          ).map(cleanUrlForBackend);
          if (existingServerBanners.length > 0 || bannerFiles.length > 0) {
            formData.append("existingBanners", JSON.stringify(existingServerBanners));
          }
        }
      }
      
      if (mode === "create") {
        await productService.createProduct(formData);
      } else {
        await productService.updateProduct((initialData as Product).id, formData);
      }
      
      if (onSubmit) {
        const submitData: ProductFormData = {
          ...form,
          slug
        };
        onSubmit(submitData);
      }
      
      toast.success(`Product ${mode === "create" ? "created" : "updated"} successfully!`);
      
      if (mode === "create") {
        // Reset form
        setForm(initialFormData);
        setSelectedColors([]);
        setSelectedSizes([]);
        setColorMedia({});
        setThumbFile(null);
        setBannerFiles([]);
        // Removed setThumbName since it was unused
        if (thumbInputRef.current) thumbInputRef.current.value = "";
        if (bannerInputRef.current) bannerInputRef.current.value = "";
      }
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} product:`, error);
      toast.error(`Failed to ${mode} product`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#dc2626] to-red-700 px-4 py-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-white">
                {mode === "create" ? "Create New Product" : "Edit Product"}
              </h3>
              <p className="text-red-100 text-xs">
                {mode === "create"
                  ? "Add a new product to your inventory"
                  : "Update product information and settings"
                }
              </p>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-white hover:text-red-200 p-1.5 hover:bg-white/20 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="space-y-4">
            {/* Basic Info Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Premium Compression T-Shirt"
                    className="block w-full rounded-lg border border-gray-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="block w-full rounded-lg border border-gray-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] px-3 py-2 text-sm text-gray-900"
                    value={form.vendor || ""}
                    onChange={(e) => setField("vendor", e.target.value)}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendor && <p className="mt-1 text-xs text-red-600">{errors.vendor}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="block w-full rounded-lg border border-gray-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] px-3 py-2 text-sm text-gray-900"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price {!isVariant && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={!isVariant}
                    placeholder="0.00"
                    className="block w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] text-sm text-gray-900"
                    value={form.costPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setField("costPrice", val === "" ? undefined : Number(val));
                    }}
                  />
                  {errors.costPrice && <p className="mt-1 text-xs text-red-600">{errors.costPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price {!isVariant && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={!isVariant}
                    disabled={isVariant}
                    placeholder="0.00"
                    className={`block w-full px-3 py-2 rounded-lg border text-sm ${
                      isVariant
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 text-gray-900 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                    }`}
                    value={isVariant ? 0 : form.price}
                    onChange={(e) => setField("price", Number(e.target.value))}
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                  {isVariant && <p className="mt-1 text-xs text-[#dc2626]">Set individual prices for each variant below</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discounted Price <span className="text-xs text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isVariant}
                    placeholder="0.00"
                    className={`block w-full px-3 py-2 rounded-lg border text-sm ${
                      isVariant
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 text-gray-900 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                    }`}
                    value={isVariant ? "" : (form.discountedPrice ?? "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      setField("discountedPrice", val === "" ? undefined : Number(val));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isVariant}
                    placeholder="0"
                    className={`block w-full px-3 py-2 rounded-lg border text-sm ${
                      isVariant
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 text-gray-900 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                    }`}
                    value={isVariant ? 0 : form.stock}
                    onChange={(e) => setField("stock", Number(e.target.value))}
                  />
                  {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
                  {isVariant && <p className="mt-1 text-xs text-gray-500">Total stock will auto-sum from all variants</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] px-3 py-2 text-sm text-gray-900"
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as ProductFormData["status"])}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Type Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">Product Type</h4>
                {mode === 'edit' && <span className="ml-2 text-xs text-amber-600">(Cannot change after creation)</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center rounded-lg border p-3 ${
                  !isVariant
                    ? 'border-[#dc2626] bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${mode === 'edit' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="productType"
                    value="single"
                    checked={!isVariant}
                    disabled={mode === 'edit'}
                    onChange={() => {
                      setField("productType", "single");
                      setSelectedColors([]);
                      setSelectedSizes([]);
                      setField("variants", []);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                    !isVariant ? 'border-[#dc2626]' : 'border-gray-300'
                  }`}>
                    {!isVariant && <div className="w-2 h-2 bg-[#dc2626] rounded-full" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Single Product</div>
                    <div className="text-xs text-gray-500">One price, one stock</div>
                  </div>
                </label>
                <label className={`relative flex items-center rounded-lg border p-3 ${
                  isVariant
                    ? 'border-[#dc2626] bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${mode === 'edit' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="productType"
                    value="variant"
                    checked={isVariant}
                    disabled={mode === 'edit'}
                    onChange={() => setField("productType", "variant")}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                    isVariant ? 'border-[#dc2626]' : 'border-gray-300'
                  }`}>
                    {isVariant && <div className="w-2 h-2 bg-[#dc2626] rounded-full" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Variant Product</div>
                    <div className="text-xs text-gray-500">Multiple colors & sizes</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Variant Configuration */}
            {isVariant && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-medium text-gray-700">Colors *</label>
                      {onManageAttributes && (
                        <button type="button" onClick={onManageAttributes} className="text-xs text-[#dc2626] hover:text-red-700">
                          Manage
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <label key={color} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(color)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColors([...selectedColors, color]);
                              } else {
                                setSelectedColors(selectedColors.filter(c => c !== color));
                              }
                            }}
                            className="focus:ring-[#dc2626] h-3.5 w-3.5 text-[#dc2626] border-gray-300 rounded"
                          />
                          <span className="ml-1.5 text-gray-700">{color}</span>
                        </label>
                      ))}
                    </div>
                    {errors.colors && <p className="mt-1 text-xs text-red-600">{errors.colors}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-medium text-gray-700">Sizes *</label>
                      {onManageAttributes && (
                        <button type="button" onClick={onManageAttributes} className="text-xs text-[#dc2626] hover:text-red-700">
                          Manage
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => (
                        <label key={size} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(size)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSizes([...selectedSizes, size]);
                              } else {
                                setSelectedSizes(selectedSizes.filter(s => s !== size));
                              }
                            }}
                            className="focus:ring-[#dc2626] h-3.5 w-3.5 text-[#dc2626] border-gray-300 rounded"
                          />
                          <span className="ml-1.5 text-gray-700">{size}</span>
                        </label>
                      ))}
                    </div>
                    {errors.sizes && <p className="mt-1 text-xs text-red-600">{errors.sizes}</p>}
                  </div>
                </div>

                {/* Variants Table */}
                {variantCombos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Variant Pricing & Stock</label>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(form.variants as ProductVariant[] || []).map((variant: ProductVariant, index: number) => {
                            const discountPercent = variant.price && variant.discountedPrice
                              ? Math.round((1 - variant.discountedPrice / variant.price) * 100)
                              : 0;
                            return (
                            <tr key={`${variant.color}-${variant.size}`}>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-900">{variant.color}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-900">{variant.size}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.price || ""}
                                  onChange={(e) => {
                                    const newVariants = [...(form.variants as ProductVariant[] || [])];
                                    const newPrice = Number(e.target.value);
                                    const newDiscountedPrice = discountPercent > 0
                                      ? Number((newPrice * (1 - discountPercent / 100)).toFixed(2))
                                      : undefined;
                                    newVariants[index] = { ...variant, price: newPrice, discountedPrice: newDiscountedPrice };
                                    setField("variants", newVariants);
                                  }}
                                  className="w-20 rounded border-gray-300 text-sm py-1 px-2 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={discountPercent || ""}
                                  onChange={(e) => {
                                    const newVariants = [...(form.variants as ProductVariant[] || [])];
                                    const percent = Number(e.target.value);
                                    const discountedPrice = percent > 0 && variant.price
                                      ? Number((variant.price * (1 - percent / 100)).toFixed(2))
                                      : undefined;
                                    newVariants[index] = { ...variant, discountedPrice };
                                    setField("variants", newVariants);
                                  }}
                                  className="w-16 rounded border-gray-300 text-sm py-1 px-2 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.discountedPrice || ""}
                                  onChange={(e) => {
                                    const newVariants = [...(form.variants as ProductVariant[] || [])];
                                    const newDiscountedPrice = e.target.value ? Number(e.target.value) : undefined;
                                    newVariants[index] = { ...variant, discountedPrice: newDiscountedPrice };
                                    setField("variants", newVariants);
                                  }}
                                  className="w-20 rounded border-gray-300 text-sm py-1 px-2 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.stock || ""}
                                  onChange={(e) => {
                                    const newVariants = [...(form.variants as ProductVariant[] || [])];
                                    newVariants[index] = { ...variant, stock: Number(e.target.value) };
                                    setField("variants", newVariants);
                                  }}
                                  className="w-16 rounded border-gray-300 text-sm py-1 px-2 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                                />
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap">
                                {index === 0 && (form.variants as ProductVariant[] || []).length > 1 && (
                                  <button
                                    type="button"
                                    title="Apply to all"
                                    onClick={() => {
                                      const firstVariant = (form.variants as ProductVariant[])[0];
                                      const newVariants = (form.variants as ProductVariant[]).map((v) => ({
                                        ...v,
                                        price: firstVariant.price,
                                        discountedPrice: firstVariant.discountedPrice,
                                        stock: firstVariant.stock,
                                      }));
                                      setField("variants", newVariants);
                                    }}
                                    className="p-1 text-[#dc2626] hover:bg-red-50 rounded"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Images */}
            {!isVariant && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Product Images</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail *</label>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "thumbnail")}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-red-50 file:text-[#dc2626] hover:file:bg-red-100"
                  />
                  {isValidUrl(form.thumbnailUrl?.toString()) && (
                    <div className="mt-2">
                      <Image
                        src={form.thumbnailUrl!.toString()}
                        alt="Thumbnail preview"
                        width={80}
                        height={80}
                        className="object-cover rounded border"
                        unoptimized
                      />
                    </div>
                  )}
                  {errors.thumbnail && <p className="mt-1 text-xs text-red-600">{errors.thumbnail}</p>}
                </div>
              </div>
            )}

            {/* Color-specific images for variant products */}
            {isVariant && selectedColors.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Color Images</h4>
                </div>
                {selectedColors.map((color) => (
                  <div key={color} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color.toLowerCase() }}></span>
                        {color}
                      </h5>
                      <button
                        type="button"
                        onClick={() => clearColorMedia(color)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Thumbnail</label>
                      <input
                        ref={(el) => { colorThumbRefs.current[color] = el; }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleColorThumbFiles(color, e.target.files);
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-red-50 file:text-[#dc2626] hover:file:bg-red-100"
                      />
                      {isValidUrl(colorMedia[color]?.thumbnailUrl) && (
                        <div className="mt-2">
                          <Image
                            src={colorMedia[color].thumbnailUrl}
                            alt={`${color} thumbnail`}
                            width={60}
                            height={60}
                            className="object-cover rounded border"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-end items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#dc2626] hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                mode === "create" ? "Create Product" : "Update Product"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}