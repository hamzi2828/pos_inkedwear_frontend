'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ShoppingCart,
  Calendar,
  FileText,
} from 'lucide-react';
import { vendorService } from '../../vendors/service/vendorService';
import type { Vendor, CreatePurchaseData, PurchaseItem } from '../../vendors/types';

interface ItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get('vendorId');

  // Form state
  const [vendorId, setVendorId] = useState(preselectedVendorId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ]);

  // Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await vendorService.getVendors();
        setVendors(data);
        // Set preselected vendor if provided
        if (preselectedVendorId && !vendorId) {
          setVendorId(preselectedVendorId);
        }
      } catch (e) {
        console.error('Failed to fetch vendors:', e);
      } finally {
        setVendorsLoading(false);
      }
    };
    fetchVendors();
  }, [preselectedVendorId]);

  // Generate invoice number
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const date = new Date();
      const prefix = 'PO';
      const timestamp = date.getFullYear().toString().slice(-2) +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${timestamp}-${random}`;
    };
    setInvoiceNumber(generateInvoiceNumber());
  }, []);

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = discount;
  const total = subtotal + taxAmount - discountAmount;

  // Item handlers
  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }
    if (items.every((item) => !item.description.trim())) {
      setError('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const purchaseData: CreatePurchaseData = {
        vendorId,
        invoiceNumber: invoiceNumber.trim(),
        purchaseDate,
        dueDate: dueDate || undefined,
        items: items
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        tax,
        discount,
        notes: notes.trim() || undefined,
      };

      await vendorService.createPurchase(purchaseData);
      router.push('/dashboard/purchases');
    } catch (err: unknown) {
      console.error('Error creating purchase:', err);
      setError('Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/purchases"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
          <p className="mt-1 text-sm text-gray-500">Create a new purchase order</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Purchase Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              {vendorsLoading ? (
                <div className="flex items-center gap-2 py-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vendors...
                </div>
              ) : (
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select a vendor...</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#dc2626]" />
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-500 w-24">Qty</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 w-32">Unit Price</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 w-32">Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                        placeholder="Item description"
                        disabled={loading}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent text-center"
                        min="1"
                        disabled={loading}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent text-right"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1 || loading}
                        className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tax (%)</span>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={loading}
                />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax Amount</span>
                  <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Discount (Rs)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                  min="0"
                  disabled={loading}
                />
              </div>

              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#dc2626]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            rows={3}
            placeholder="Additional notes (optional)"
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/purchases"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Purchase'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
