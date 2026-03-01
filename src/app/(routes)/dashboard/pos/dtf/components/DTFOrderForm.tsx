'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  X,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Ruler,
  Palette,
  Shirt,
  Zap,
  FileImage,
  Plus,
  Trash2,
  Building2,
  Image,
} from 'lucide-react';
import {
  DTFArtwork,
  DTFArtworkItem,
  DTFPricingResult,
  DTFPricingConfig,
  DTFOrderFormData,
  DTFSheetType,
  DTFFilmType,
  DTFInkConfig,
  DTFGarmentType,
  DTFGarmentColor,
  POSCustomer,
  POSTax,
  AppliedTax,
} from '../../types';
import {
  uploadDTFArtwork,
  calculateDTFPrice,
  createDTFOrder,
  getFilmTypeLabel,
  uploadBankTransferScreenshot,
  getDTFPricingConfig,
} from '../services/dtfService';
import { formatCurrency, getCurrencySymbol } from '@/helper/helper';

interface DTFOrderFormProps {
  customer?: POSCustomer | null;
  onOrderCreated: (orderNumber: string) => void;
  onSelectCustomer: () => void;
  currency?: string;
  availableTaxes?: POSTax[];
  selectedTaxIds?: string[];
  onTaxSelectionChange?: (taxIds: string[]) => void;
}

const initialFormData: DTFOrderFormData = {
  jobName: '',
  sheetType: 'A3',
  filmType: 'standard',
  inkConfiguration: 'standard',
  garmentType: 'cotton',
  garmentColor: 'light',
  quantity: 1,
  backgroundRemovalRequired: false,
  mirroredConfirmed: false,
  isRushOrder: false,
  dueDate: '',
  dimensions: {
    width: 0,
    height: 0,
    dpi: 300,
    colorProfile: 'RGB',
  },
};

// Generate unique ID for artwork items
const generateId = () => `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function DTFOrderForm({
  customer,
  onOrderCreated,
  onSelectCustomer,
  currency = 'PKR',
  availableTaxes = [],
  selectedTaxIds = [],
  onTaxSelectionChange,
}: DTFOrderFormProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const [formData, setFormData] = useState<DTFOrderFormData>(initialFormData);
  const [artworkItems, setArtworkItems] = useState<DTFArtworkItem[]>([]);
  const [pricing, setPricing] = useState<DTFPricingResult | null>(null);
  const [pricingConfig, setPricingConfig] = useState<DTFPricingConfig | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Bank transfer screenshot
  const [bankScreenshot, setBankScreenshot] = useState<string | null>(null);
  const [bankScreenshotFile, setBankScreenshotFile] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Calculate applied taxes from selected taxes
  const appliedTaxes: AppliedTax[] = selectedTaxIds
    .map(taxId => {
      const tax = availableTaxes.find(t => t.taxId === taxId);
      if (!tax || !pricing) return null;
      return {
        taxId: tax.taxId,
        name: tax.name,
        rate: tax.rate,
        amount: pricing.subtotal * (tax.rate / 100),
      };
    })
    .filter((t): t is AppliedTax => t !== null);

  const totalCustomTax = appliedTaxes.reduce((sum, t) => sum + t.amount, 0);
  const customTotal = pricing ? pricing.subtotal + totalCustomTax : 0;

  // Load pricing config on mount
  useEffect(() => {
    const loadPricingConfig = async () => {
      try {
        const config = await getDTFPricingConfig();
        setPricingConfig(config);
      } catch (err) {
        console.error('Failed to load pricing config:', err);
      }
    };
    loadPricingConfig();
  }, []);

  // Calculate pricing when form data changes
  const recalculatePrice = useCallback(async () => {
    if (formData.dimensions.width <= 0 || formData.dimensions.height <= 0) {
      setPricing(null);
      return;
    }

    try {
      setCalculating(true);
      const result = await calculateDTFPrice({
        dimensions: formData.dimensions,
        filmType: formData.filmType,
        inkConfiguration: formData.inkConfiguration,
        quantity: formData.quantity,
        backgroundRemovalRequired: formData.backgroundRemovalRequired,
        isRushOrder: formData.isRushOrder,
      });
      setPricing(result);
    } catch (err) {
      console.error('Failed to calculate price:', err);
    } finally {
      setCalculating(false);
    }
  }, [formData]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      recalculatePrice();
    }, 300);
    return () => clearTimeout(debounce);
  }, [recalculatePrice]);

  // Add new artwork item
  const addArtworkItem = () => {
    const newItem: DTFArtworkItem = {
      id: generateId(),
      customName: '',
    };
    setArtworkItems(prev => [...prev, newItem]);
  };

  // Remove artwork item
  const removeArtworkItem = (id: string) => {
    setArtworkItems(prev => prev.filter(item => item.id !== id));
  };

  // Update artwork item name
  const updateArtworkName = (id: string, name: string) => {
    setArtworkItems(prev =>
      prev.map(item => (item.id === id ? { ...item, customName: name } : item))
    );
  };

  // Handle file selection for an artwork item
  const handleFileSelect = async (id: string, file: File | null) => {
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setArtworkItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, error: 'File size must be less than 50MB' } : item
        )
      );
      return;
    }

    setArtworkItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, file, error: undefined, artwork: undefined }
          : item
      )
    );
  };

  // Handle bank transfer screenshot selection
  const handleScreenshotSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Screenshot must be less than 10MB');
      return;
    }

    setBankScreenshotFile(file);
    setBankScreenshot(null);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.jobName.trim()) {
      setError('Job name is required');
      return;
    }

    if (formData.dimensions.width <= 0 || formData.dimensions.height <= 0) {
      setError('Please enter valid dimensions');
      return;
    }

    if (!formData.mirroredConfirmed) {
      setError('Please confirm that the design will be mirrored');
      return;
    }

    const effectiveTotal = availableTaxes.length > 0 && onTaxSelectionChange ? customTotal : (pricing?.total || 0);

    // Auto-detect partial payment based on paid amount vs total
    const isPartialPayment = paidAmount > 0 && paidAmount < effectiveTotal;

    // Validate payment amount
    if (paidAmount <= 0) {
      setError('Please enter the amount customer is paying');
      return;
    }

    // Check artwork items have names if files are selected
    const itemsWithFiles = artworkItems.filter(item => item.file || item.artwork);
    const missingNames = itemsWithFiles.filter(item => !item.customName.trim());
    if (missingNames.length > 0) {
      setError('Please provide a name for each artwork file');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Upload bank transfer screenshot if selected (required only for full bank transfer payments)
      let screenshotUrl = bankScreenshot;
      const isFullBankPayment = paymentMethod === 'bank_transfer' && paidAmount >= effectiveTotal;
      if (isFullBankPayment) {
        if (!bankScreenshot && !bankScreenshotFile) {
          setError('Please select bank transfer screenshot');
          setSubmitting(false);
          return;
        }
        if (bankScreenshotFile && !bankScreenshot) {
          try {
            const result = await uploadBankTransferScreenshot(bankScreenshotFile);
            screenshotUrl = result.url;
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload screenshot');
            setSubmitting(false);
            return;
          }
        }
      }

      // Upload all pending artwork files
      const pendingItems = artworkItems.filter(item => item.file && !item.artwork);
      const uploadedItems = [...artworkItems];

      for (const item of pendingItems) {
        if (!item.file) continue;

        try {
          const uploaded = await uploadDTFArtwork(item.file, {
            width: formData.dimensions.width || 10,
            height: formData.dimensions.height || 10,
            dpi: formData.dimensions.dpi,
            colorProfile: formData.dimensions.colorProfile,
          });

          const idx = uploadedItems.findIndex(i => i.id === item.id);
          if (idx !== -1) {
            uploadedItems[idx] = { ...uploadedItems[idx], artwork: uploaded, file: undefined };
          }
        } catch (err) {
          setError(`Failed to upload "${item.customName || 'artwork'}": ${err instanceof Error ? err.message : 'Upload failed'}`);
          setSubmitting(false);
          return;
        }
      }

      // Prepare artworks array
      const artworksData = uploadedItems
        .filter(item => item.artwork)
        .map(item => ({
          customName: item.customName.trim(),
          artwork: item.artwork!,
        }));

      const effectiveTax = availableTaxes.length > 0 && onTaxSelectionChange ? totalCustomTax : (pricing?.tax || 0);
      const effectiveTotalValue = availableTaxes.length > 0 && onTaxSelectionChange ? customTotal : (pricing?.total || 0);

      const order = await createDTFOrder({
        customer: customer?._id,
        dtfDetails: {
          ...formData,
          artworks: artworksData.length > 0 ? artworksData : undefined,
        },
        paymentMethod,
        cashAmount: paymentMethod === 'cash' && !isPartialPayment ? paidAmount : undefined,
        bankTransferScreenshot: isFullBankPayment ? screenshotUrl || undefined : undefined,
        subtotal: pricing?.subtotal,
        tax: effectiveTax,
        total: effectiveTotalValue,
        // Partial payment fields
        isPartialPayment,
        paidAmount: isPartialPayment ? paidAmount : undefined,
      });

      // Show success message with payment details
      const wasPartialPayment = isPartialPayment && paidAmount > 0;
      const pendingAmountValue = wasPartialPayment ? effectiveTotalValue - paidAmount : 0;

      // Reset form
      setFormData(initialFormData);
      setArtworkItems([]);
      setPricing(null);
      setPaidAmount(0);
      setBankScreenshot(null);
      setBankScreenshotFile(null);

      // Show appropriate message
      if (wasPartialPayment) {
        alert(`Order ${order.orderNumber} created with partial payment!\n\nPaid: ${formatCurrency(paidAmount, currency)}\nPending: ${formatCurrency(pendingAmountValue, currency)}\n\nView pending payments in POS > Pending Payments`);
      }

      onOrderCreated(order.orderNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">New DTF Order</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form Fields */}
        <div className="space-y-6">
          {/* Job Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Name / Reference *
            </label>
            <input
              type="text"
              value={formData.jobName}
              onChange={e => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
              placeholder="e.g., North High School Football - Home"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            />
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <button
              onClick={onSelectCustomer}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50"
            >
              {customer ? (
                <span>{customer.firstName} {customer.lastName}</span>
              ) : (
                <span className="text-gray-400">Walk-in Customer (Click to select)</span>
              )}
            </button>
          </div>

          {/* Artwork Upload - Multiple Files */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <FileImage className="h-4 w-4 inline mr-1" />
                Artwork Files
              </label>
              <button
                type="button"
                onClick={addArtworkItem}
                className="flex items-center gap-1 text-sm text-[#dc2626] hover:text-red-700"
              >
                <Plus className="h-4 w-4" />
                Add File
              </button>
            </div>

            {artworkItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No artwork files added</p>
                <button
                  type="button"
                  onClick={addArtworkItem}
                  className="mt-2 text-sm text-[#dc2626] hover:text-red-700"
                >
                  Click to add artwork file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {artworkItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#dc2626] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.customName}
                          onChange={(e) => updateArtworkName(item.id, e.target.value)}
                          placeholder="Enter artwork name (e.g., Front Design, Back Logo)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                        />

                        {item.artwork ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700">{item.artwork.originalFilename}</span>
                          </div>
                        ) : item.file ? (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">{item.file.name}</span>
                            <span className="text-xs text-gray-400">(uploads on submit)</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".png,.tiff,.tif,.svg,.pdf,.ai"
                              onChange={(e) => handleFileSelect(item.id, e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <span className="text-sm text-[#dc2626] hover:text-red-700">
                              Select file (PNG, TIFF, SVG, PDF, AI)
                            </span>
                          </label>
                        )}

                        {item.error && (
                          <p className="text-xs text-red-600">{item.error}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeArtworkItem(item.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Max 50MB per file</p>
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Ruler className="h-4 w-4 inline mr-1" />
              Dimensions (inches) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.width || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="Width"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.height || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="Height"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
                />
              </div>
            </div>
            {formData.dimensions.width > 0 && formData.dimensions.height > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Area: {(formData.dimensions.width * formData.dimensions.height).toFixed(2)} sq inches
              </p>
            )}
          </div>

          {/* DPI & Color Profile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DPI</label>
              <input
                type="number"
                min="72"
                value={formData.dimensions.dpi}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, dpi: parseInt(e.target.value) || 300 }
                }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#dc2626] ${
                  formData.dimensions.dpi < 300 ? 'border-yellow-400' : 'border-gray-300'
                }`}
              />
              {formData.dimensions.dpi < 300 && (
                <p className="text-xs text-yellow-600 mt-1">Recommended: 300+ DPI</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color Profile</label>
              <select
                value={formData.dimensions.colorProfile}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, colorProfile: e.target.value as 'RGB' | 'CMYK' }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="RGB">RGB</option>
                <option value="CMYK">CMYK</option>
              </select>
            </div>
          </div>

          {/* Sheet Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Size</label>
            <div className="flex gap-3">
              {(['A3', 'A4'] as DTFSheetType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, sheetType: type }))}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    formData.sheetType === type
                      ? 'bg-[#dc2626] text-white border-[#dc2626]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Film Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Palette className="h-4 w-4 inline mr-1" />
              Film Type
            </label>
            <select
              value={formData.filmType}
              onChange={e => setFormData(prev => ({ ...prev, filmType: e.target.value as DTFFilmType }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
            >
              <option value="standard">Standard</option>
              <option value="glitter">Glitter (+50%)</option>
              <option value="reflective">Reflective (+75%)</option>
              <option value="glow-in-dark">Glow-in-Dark (+100%)</option>
            </select>
          </div>

          {/* Ink Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ink Configuration</label>
            <select
              value={formData.inkConfiguration}
              onChange={e => setFormData(prev => ({ ...prev, inkConfiguration: e.target.value as DTFInkConfig }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
            >
              <option value="standard">Standard (CMYK+W)</option>
              <option value="fluorescent">Fluorescent (+30%)</option>
            </select>
          </div>

          {/* Garment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Shirt className="h-4 w-4 inline mr-1" />
                Garment Type
              </label>
              <select
                value={formData.garmentType}
                onChange={e => setFormData(prev => ({ ...prev, garmentType: e.target.value as DTFGarmentType }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="cotton">Cotton</option>
                <option value="polyester">Polyester</option>
                <option value="blend">Blend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garment Color</label>
              <select
                value={formData.garmentColor}
                onChange={e => setFormData(prev => ({ ...prev, garmentColor: e.target.value as DTFGarmentColor }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (More White Ink)</option>
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.backgroundRemovalRequired}
                onChange={e => setFormData(prev => ({ ...prev, backgroundRemovalRequired: e.target.checked }))}
                className="w-4 h-4 text-[#dc2626] rounded"
              />
              <span className="text-sm text-gray-700">
                Background Removal Required (+{currencySymbol}{pricingConfig?.setupFee?.backgroundRemoval?.toFixed(2) || '5.00'})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRushOrder}
                onChange={e => setFormData(prev => ({ ...prev, isRushOrder: e.target.checked }))}
                className="w-4 h-4 text-[#dc2626] rounded"
              />
              <span className="text-sm text-gray-700">
                <Zap className="h-4 w-4 inline mr-1 text-yellow-500" />
                Rush Order (+{((pricingConfig?.rushFeePercentage || 0.25) * 100).toFixed(0)}%)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mirroredConfirmed}
                onChange={e => setFormData(prev => ({ ...prev, mirroredConfirmed: e.target.checked }))}
                className="w-4 h-4 text-[#dc2626] rounded"
              />
              <span className="text-sm text-gray-700">
                I confirm the design will be printed mirrored (required for DTF) *
              </span>
            </label>
          </div>
        </div>

        {/* Right Column - Pricing & Payment */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Summary
              {calculating && <Loader2 className="h-4 w-4 animate-spin text-[#dc2626]" />}
            </h3>

            {pricing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Area ({pricing.squareInches} sq in)</span>
                  <span className="text-gray-900">{formatCurrency(pricing.basePrice, currency)}</span>
                </div>
                {pricing.setupFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Setup Fee</span>
                    <span className="text-gray-900">{formatCurrency(pricing.setupFee, currency)}</span>
                  </div>
                )}
                {pricing.rushFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rush Fee</span>
                    <span className="text-gray-900">{formatCurrency(pricing.rushFee, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(pricing.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax ({((pricing.taxRate || 0.08) * 100).toFixed(0)}%)
                  </span>
                  <span className="text-gray-900">{formatCurrency(availableTaxes.length > 0 ? totalCustomTax : pricing.tax, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-[#dc2626]">
                    {formatCurrency(availableTaxes.length > 0 && onTaxSelectionChange ? customTotal : pricing.total, currency)}
                  </span>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>Film: {getFilmTypeLabel(formData.filmType)} (x{pricing.breakdown.filmTypeMultiplier})</p>
                  <p>Ink: {formData.inkConfiguration} (x{pricing.breakdown.inkMultiplier})</p>
                  <p>Quantity: {formData.quantity}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Enter dimensions to calculate price</p>
            )}
          </div>

          {/* Payment Method */}
          {pricing && (() => {
            const effectiveTotal = availableTaxes.length > 0 && onTaxSelectionChange ? customTotal : pricing.total;
            const isPartialPayment = paidAmount > 0 && paidAmount < effectiveTotal;
            const pendingAmount = isPartialPayment ? effectiveTotal - paidAmount : 0;
            const isFullPayment = paidAmount >= effectiveTotal;

            return (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>

                {/* Payment Method Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-3 rounded-lg border transition-colors text-sm font-medium ${
                      paymentMethod === 'cash'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`px-3 py-3 rounded-lg border transition-colors text-sm font-medium ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`px-3 py-3 rounded-lg border transition-colors text-sm font-medium flex items-center justify-center gap-1 ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Bank
                  </button>
                </div>

                {/* Amount Paying */}
                <div className={`p-3 rounded-lg border ${isPartialPayment ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-sm font-medium mb-2 ${isPartialPayment ? 'text-orange-800' : 'text-gray-700'}`}>
                    Amount Paying
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmount || ''}
                    onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                      isPartialPayment
                        ? 'border-orange-300 focus:ring-orange-500'
                        : 'border-gray-300 focus:ring-[#dc2626]'
                    }`}
                    placeholder={`Total: ${formatCurrency(effectiveTotal, currency)}`}
                  />

                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500, 1000, 2000, 5000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setPaidAmount(amount)}
                        className={`px-3 py-1 text-sm rounded ${
                          isPartialPayment ? 'bg-orange-200 hover:bg-orange-300' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {currencySymbol}{amount}
                      </button>
                    ))}
                    <button
                      onClick={() => setPaidAmount(Math.ceil(effectiveTotal))}
                      className="px-3 py-1 text-sm bg-[#dc2626]/10 text-[#dc2626] rounded hover:bg-[#dc2626]/20"
                    >
                      Full Amount
                    </button>
                  </div>

                  {/* Payment Status Display */}
                  {paidAmount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {isFullPayment ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 font-medium">Full Payment</span>
                          {paidAmount > effectiveTotal && (
                            <span className="text-sm text-green-600">
                              Change: {formatCurrency(paidAmount - effectiveTotal, currency)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Paying Now:</span>
                            <span className="text-green-600 font-medium">{formatCurrency(paidAmount, currency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600">Pending:</span>
                            <span className="text-orange-600 font-medium">{formatCurrency(pendingAmount, currency)}</span>
                          </div>
                          <p className="text-xs text-orange-500 mt-1">
                            Will appear in POS → Pending Payments
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bank Transfer Screenshot - only for full payment */}
                {paymentMethod === 'bank_transfer' && isFullPayment && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Image className="h-4 w-4 inline mr-1" />
                      Transfer Screenshot
                    </label>

                    {bankScreenshot ? (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-700">Screenshot uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBankScreenshot(null);
                              setBankScreenshotFile(null);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : bankScreenshotFile ? (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{bankScreenshotFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setBankScreenshotFile(null)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleScreenshotSelect(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                          <Upload className="h-6 w-6 mx-auto text-purple-400 mb-2" />
                          <p className="text-sm text-purple-600">Click to select screenshot</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Submit Button */}
          {(() => {
            const effectiveTotal = pricing ? (availableTaxes.length > 0 && onTaxSelectionChange ? customTotal : pricing.total) : 0;
            const isPartialPayment = paidAmount > 0 && paidAmount < effectiveTotal;

            return (
              <button
                onClick={handleSubmit}
                disabled={submitting || !pricing || !formData.mirroredConfirmed || paidAmount <= 0}
                className={`w-full py-4 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 ${
                  isPartialPayment ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#dc2626] hover:bg-red-700'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Order...</span>
                  </div>
                ) : isPartialPayment ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>Create DTF Order (Partial Payment)</span>
                    </div>
                    <span className="text-sm opacity-90">
                      Paying {formatCurrency(paidAmount, currency)} | Pending {formatCurrency(effectiveTotal - paidAmount, currency)}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span>Create DTF Order{pricing && ` - ${formatCurrency(effectiveTotal, currency)}`}</span>
                  </div>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
