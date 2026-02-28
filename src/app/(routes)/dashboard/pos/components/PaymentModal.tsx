// Payment Modal Component
'use client';

import { useState, useEffect } from 'react';
import { PaymentMethodType, POSCart, POSCustomer, CustomerInfo } from '../types';
import { X, CreditCard, Banknote, Building2, Upload, Loader2, Check, AlertCircle, User, Phone, Car } from 'lucide-react';
import { uploadBankTransferScreenshot } from '../services/posUploadService';
import { getCurrencySymbol } from '@/helper/helper';

interface PaymentModalProps {
  isOpen: boolean;
  cart: POSCart;
  customer?: POSCustomer | null;
  onClose: () => void;
  onConfirm: (
    paymentMethod: PaymentMethodType,
    cashAmount?: number,
    bankTransferScreenshot?: string,
    isPartialPayment?: boolean,
    paidAmount?: number,
    customerInfo?: CustomerInfo
  ) => void;
  currency?: string;
}

export default function PaymentModal({
  isOpen,
  cart,
  customer,
  onClose,
  onConfirm,
  currency = 'PKR',
}: PaymentModalProps) {
  const symbol = getCurrencySymbol(currency);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [bankScreenshotFile, setBankScreenshotFile] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  // Customer info fields (required)
  const [customerName, setCustomerName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [vehicleName, setVehicleName] = useState<string>('');
  const [customerFieldsError, setCustomerFieldsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCashReceived('');
      setBankScreenshotFile(null);
      setScreenshotError(null);
      setCustomerFieldsError(null);

      // Pre-fill if customer is already selected
      if (customer) {
        setCustomerName(`${customer.firstName || ''} ${customer.lastName || ''}`.trim());
        setMobileNumber(customer.phone || '');
        // Get first vehicle if exists
        const cars = Array.isArray(customer.carDetails) ? customer.carDetails : customer.carDetails ? [customer.carDetails] : [];
        if (cars.length > 0 && cars[0].model) {
          setVehicleName(cars[0].model);
        } else {
          setVehicleName('');
        }
      } else {
        setCustomerName('');
        setMobileNumber('');
        setVehicleName('');
      }
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - cart.total;
  const isPartialPayment = (paymentMethod === 'cash' || paymentMethod === 'bank_transfer') && cashAmount > 0 && cashAmount < cart.total;
  const pendingAmount = isPartialPayment ? cart.total - cashAmount : 0;

  // Validate required customer fields
  const isCustomerInfoValid = customerName.trim() !== '' && mobileNumber.trim() !== '' && vehicleName.trim() !== '';

  const isValidCash = paymentMethod === 'cash' && cashAmount > 0 && (cashAmount >= cart.total || isCustomerInfoValid);
  const isValidBankTransfer = paymentMethod === 'bank_transfer' && cashAmount > 0 && (cashAmount >= cart.total || isCustomerInfoValid);
  const isValidCard = paymentMethod === 'card';
  const canProceed = isCustomerInfoValid && (isValidCard || isValidCash || isValidBankTransfer);

  const handleConfirm = async () => {
    // Validate customer fields
    if (!customerName.trim()) {
      setCustomerFieldsError('Customer name is required');
      return;
    }
    if (!mobileNumber.trim()) {
      setCustomerFieldsError('Mobile number is required');
      return;
    }
    if (!vehicleName.trim()) {
      setCustomerFieldsError('Vehicle name is required');
      return;
    }

    if (!canProceed) return;
    setProcessing(true);
    setScreenshotError(null);
    setCustomerFieldsError(null);

    try {
      let screenshotUrl: string | undefined;
      if (paymentMethod === 'bank_transfer' && bankScreenshotFile) {
        try {
          const result = await uploadBankTransferScreenshot(bankScreenshotFile);
          screenshotUrl = result.url;
        } catch (err: any) {
          setScreenshotError(err?.message || 'Failed to upload screenshot');
          setProcessing(false);
          return;
        }
      }

      // Build customer info
      const customerInfo: CustomerInfo = {
        name: customerName.trim(),
        phone: mobileNumber.trim(),
        vehicleName: vehicleName.trim()
      };

      await onConfirm(
        paymentMethod,
        (paymentMethod === 'cash' || paymentMethod === 'bank_transfer') ? cashAmount : undefined,
        screenshotUrl,
        isPartialPayment,
        isPartialPayment ? cashAmount : undefined,
        customerInfo
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleScreenshotSelect = (file: File | null) => {
    if (!file) return;
    setScreenshotError(null);
    if (!file.type.startsWith('image/')) { setScreenshotError('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setScreenshotError('File must be less than 10MB'); return; }
    setBankScreenshotFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Payment</h2>
            <span className="text-xl font-bold text-green-600">{symbol}{cart.total.toFixed(2)}</span>
            {customer && <span className="text-xs text-gray-500 ml-2">({customer.firstName})</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={processing}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Customer Info Fields (Required) */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Details <span className="text-red-500">*</span>
            </div>

            {customerFieldsError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {customerFieldsError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name *"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                    !customerName.trim() && customerFieldsError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Mobile Number *"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                    !mobileNumber.trim() && customerFieldsError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Vehicle Name *"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                    !vehicleName.trim() && customerFieldsError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-2 rounded-lg border-2 transition-colors ${
                paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <Banknote className="h-5 w-5 mx-auto text-gray-700" />
              <div className="text-xs font-medium mt-1">Cash</div>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-2 rounded-lg border-2 transition-colors ${
                paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <CreditCard className="h-5 w-5 mx-auto text-gray-700" />
              <div className="text-xs font-medium mt-1">Card</div>
            </button>
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-2 rounded-lg border-2 transition-colors ${
                paymentMethod === 'bank_transfer' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Building2 className="h-5 w-5 mx-auto text-gray-700" />
              <div className="text-xs font-medium mt-1">Bank</div>
            </button>
          </div>

          {/* Cash Payment */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rs</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[cart.total, Math.ceil(cart.total / 10) * 10, Math.ceil(cart.total / 50) * 50, Math.ceil(cart.total / 100) * 100].map((amt, i) => (
                  <button
                    key={i}
                    onClick={() => setCashReceived(amt.toString())}
                    className="py-1.5 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400"
                  >
                    {symbol}{amt.toFixed(0)}
                  </button>
                ))}
              </div>
              {cashAmount > 0 && (
                cashAmount >= cart.total ? (
                  <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-700">Change:</span>
                    <span className="text-lg font-bold text-green-700">{symbol}{change.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className={`rounded-lg px-3 py-2 ${isCustomerInfoValid ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-300'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Paid: {symbol}{cashAmount.toFixed(2)}</span>
                      <span className="text-sm font-bold text-red-600">Pending: {symbol}{pendingAmount.toFixed(2)}</span>
                    </div>
                    {!isCustomerInfoValid ? (
                      <div className="mt-2 p-2 bg-red-100 rounded text-center">
                        <AlertCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                        <p className="text-xs text-red-700 font-medium">Customer Details Required for Partial Payment</p>
                        <p className="text-xs text-red-600">Fill in all customer fields above</p>
                      </div>
                    ) : (
                      <p className="text-xs text-orange-600 mt-1">Pending saved under {customerName}</p>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Card Payment */}
          {paymentMethod === 'card' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Card payment via Stripe. Full amount: {symbol}{cart.total.toFixed(2)}
            </div>
          )}

          {/* Bank Transfer */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rs</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={cart.total.toFixed(2)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button onClick={() => setCashReceived(cart.total.toFixed(2))} className="py-1.5 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Exact</button>
                {[Math.ceil(cart.total / 10) * 10, Math.ceil(cart.total / 50) * 50, Math.ceil(cart.total / 100) * 100].map((amt) => (
                  <button key={amt} onClick={() => setCashReceived(amt.toString())} className="py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">{symbol}{amt}</button>
                ))}
              </div>
              {cashAmount > 0 && cashAmount < cart.total && (
                <div className={`rounded-lg px-3 py-2 ${isCustomerInfoValid ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-300'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Paid: {symbol}{cashAmount.toFixed(2)}</span>
                    <span className="text-sm font-bold text-red-600">Pending: {symbol}{pendingAmount.toFixed(2)}</span>
                  </div>
                  {!isCustomerInfoValid ? (
                    <div className="mt-2 p-2 bg-red-100 rounded text-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                      <p className="text-xs text-red-700 font-medium">Customer Details Required for Partial Payment</p>
                      <p className="text-xs text-red-600">Fill in all customer fields above</p>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-600 mt-1">Pending saved under {customerName}</p>
                  )}
                </div>
              )}
              {/* Screenshot Upload */}
              <div className="flex items-center gap-2">
                {bankScreenshotFile ? (
                  <div className="flex-1 flex items-center gap-2 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-700 truncate flex-1">{bankScreenshotFile.name}</span>
                    <button onClick={() => setBankScreenshotFile(null)} className="text-red-500"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="flex-1 flex items-center gap-2 border border-dashed border-purple-300 rounded px-3 py-1.5 cursor-pointer hover:bg-purple-50">
                    <Upload className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-purple-600">Screenshot (optional)</span>
                    <input type="file" accept="image/*" onChange={(e) => handleScreenshotSelect(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                )}
              </div>
              {screenshotError && <p className="text-xs text-red-600">{screenshotError}</p>}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!canProceed || processing}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              canProceed && !processing
                ? isPartialPayment
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : paymentMethod === 'bank_transfer'
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : paymentMethod === 'cash'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : isPartialPayment ? (
              `Pay ${symbol}${cashAmount.toFixed(0)} (Pending: ${symbol}${pendingAmount.toFixed(0)})`
            ) : paymentMethod === 'card' ? (
              'Process Card Payment'
            ) : (
              `Complete Payment`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
