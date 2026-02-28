'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Edit2,
  Plus,
  Download,
  Truck,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { vendorService } from '../../vendors/service/vendorService';
import type { Purchase, Payment, CreatePaymentData } from '../../vendors/types';
import jsPDF from 'jspdf';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseDetailPage({ params }: PageProps) {
  const { id: purchaseId } = use(params);
  const router = useRouter();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchPurchaseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [purchaseData, paymentsData] = await Promise.all([
        vendorService.getPurchase(purchaseId),
        vendorService.getPayments({ purchaseId }).catch(() => []),
      ]);

      setPurchase(purchaseData);
      setPayments(paymentsData);
    } catch (e) {
      console.error('Error fetching purchase:', e);
      setError('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  const handleAddPayment = async () => {
    if (!purchase || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    setPaymentLoading(true);
    try {
      const paymentData: CreatePaymentData = {
        vendorId: purchase.vendorId,
        purchaseId: purchase._id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        paymentDate: new Date().toISOString(),
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await vendorService.createPayment(paymentData);

      // Refresh data
      await fetchPurchaseData();

      // Reset and close modal
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to add payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Partial Payment
          </span>
        );
      case 'overdue':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
    }
  };

  const downloadPurchasePdf = () => {
    if (!purchase) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.text(purchase.invoiceNumber, 105, yPos, { align: 'center' });
    yPos += 15;

    // Vendor Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(purchase.vendor?.name || 'Unknown', 14, yPos);
    yPos += 5;
    doc.text(`Date: ${formatDate(purchase.purchaseDate)}`, 14, yPos);
    if (purchase.dueDate) {
      doc.text(`Due: ${formatDate(purchase.dueDate)}`, 80, yPos);
    }
    yPos += 12;

    // Items table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 4, 182, 8, 'F');
    doc.text('Description', 16, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 140, yPos);
    doc.text('Total', 175, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    purchase.items.forEach((item) => {
      doc.text(item.description.slice(0, 50), 16, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(item.unitPrice.toLocaleString(), 140, yPos);
      doc.text(item.total.toLocaleString(), 175, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Totals
    doc.text(`Subtotal: Rs ${purchase.subtotal.toLocaleString()}`, 140, yPos);
    yPos += 6;
    if (purchase.tax > 0) {
      doc.text(`Tax: Rs ${purchase.tax.toLocaleString()}`, 140, yPos);
      yPos += 6;
    }
    if (purchase.discount > 0) {
      doc.text(`Discount: Rs ${purchase.discount.toLocaleString()}`, 140, yPos);
      yPos += 6;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Total: Rs ${purchase.total.toLocaleString()}`, 140, yPos);
    yPos += 6;
    doc.text(`Paid: Rs ${purchase.paidAmount.toLocaleString()}`, 140, yPos);
    yPos += 6;
    doc.setTextColor(purchase.pendingAmount > 0 ? 200 : 0, 0, 0);
    doc.text(`Pending: Rs ${purchase.pendingAmount.toLocaleString()}`, 140, yPos);
    doc.setTextColor(0, 0, 0);

    // Notes
    if (purchase.notes) {
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(purchase.notes, 14, yPos);
    }

    doc.save(`Purchase_${purchase.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error || 'Purchase not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/purchases"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{purchase.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {purchase.vendor?.name || 'Unknown Vendor'} • {formatDate(purchase.purchaseDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchaseData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={downloadPurchasePdf}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <Link
            href={`/dashboard/purchases/edit/${purchase._id}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
          {purchase.pendingAmount > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Status & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(purchase.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Paid Amount</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(purchase.paidAmount)}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg border p-4 ${purchase.pendingAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${purchase.pendingAmount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <DollarSign className={`h-5 w-5 ${purchase.pendingAmount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${purchase.pendingAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>Pending</p>
              <p className={`text-xl font-bold ${purchase.pendingAmount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                {formatCurrency(purchase.pendingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-2">Status</p>
          {getStatusBadge(purchase.paymentStatus)}
        </div>
      </div>

      {/* Vendor & Dates Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-[#dc2626]" />
            <h3 className="font-semibold text-gray-900">Vendor Information</h3>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">{purchase.vendor?.name || 'Unknown'}</p>
            {purchase.vendor?.email && (
              <p className="text-sm text-gray-600">{purchase.vendor.email}</p>
            )}
            {purchase.vendor?.phone && (
              <p className="text-sm text-gray-600">{purchase.vendor.phone}</p>
            )}
            <Link
              href={`/dashboard/vendors/${purchase.vendorId}`}
              className="inline-flex items-center gap-1 text-sm text-[#dc2626] hover:underline mt-2"
            >
              View Vendor Profile →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#dc2626]" />
            <h3 className="font-semibold text-gray-900">Dates</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Purchase Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(purchase.purchaseDate)}</span>
            </div>
            {purchase.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(purchase.dueDate)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(purchase.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Items ({purchase.items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchase.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-500">Subtotal</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(purchase.subtotal)}</td>
              </tr>
              {purchase.tax > 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-500">Tax</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(purchase.tax)}</td>
                </tr>
              )}
              {purchase.discount > 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-500">Discount</td>
                  <td className="px-6 py-3 text-right text-sm text-green-600">-{formatCurrency(purchase.discount)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-300">
                <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-3 text-right text-lg font-bold text-[#dc2626]">{formatCurrency(purchase.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Payment History ({payments.length})</h3>
          {purchase.pendingAmount > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.paymentDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.reference || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded capitalize">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-700">Total Paid</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Notes */}
      {purchase.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{purchase.notes}</p>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max={purchase.pendingAmount}
                    step="1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding: {formatCurrency(purchase.pendingAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank' | 'cheque' | 'other')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Receipt No</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={paymentLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {paymentLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
