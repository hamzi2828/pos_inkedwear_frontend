'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { CreatePaymentData } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePaymentData) => Promise<void>;
  maxAmount: number;
  loading: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  maxAmount,
  loading,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Amount cannot exceed remaining balance (Rs ${maxAmount.toLocaleString()})`);
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    await onSubmit({
      amount: amountNum,
      date,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleClose = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="text-sm text-gray-500 mb-4">
            Remaining balance: <span className="font-medium text-gray-900">Rs {maxAmount.toLocaleString()}</span>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rs) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
              placeholder="Enter amount"
              min="0"
              max={maxAmount}
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
              placeholder="Add any notes about this payment"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
