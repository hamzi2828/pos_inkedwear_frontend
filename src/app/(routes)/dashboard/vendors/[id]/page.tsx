'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  CreditCard,
  FileText,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { vendorService } from '../service/vendorService';
import type { Vendor, RawVendor, LedgerEntry, Purchase, Payment, CreatePaymentData } from '../types';
import jsPDF from 'jspdf';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { id: vendorId } = use(params);
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
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

  const fetchVendorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [vendorData, ledgerData, purchasesData, paymentsData] = await Promise.all([
        vendorService.getVendor(vendorId),
        vendorService.getVendorLedger(vendorId).catch(() => []),
        vendorService.getPurchases({ vendorId }).catch(() => []),
        vendorService.getPayments({ vendorId }).catch(() => []),
      ]);

      // Parse vendor data
      const v = vendorData as RawVendor;
      setVendor({
        _id: String(v._id),
        name: String(v.name ?? ''),
        contactPerson: String(v.contactPerson ?? ''),
        email: String(v.email ?? ''),
        phone: v.phone || null,
        address: {
          street: v.address?.street || '',
          city: v.address?.city || '',
          state: v.address?.state || '',
          zipCode: v.address?.zipCode || '',
          country: v.address?.country || '',
        },
        category: String(v.category ?? ''),
        notes: String(v.notes ?? ''),
        isActive: typeof v.isActive === 'boolean' ? v.isActive : true,
        createdAt: String(v.createdAt ?? new Date().toISOString()),
        updatedAt: String(v.updatedAt ?? new Date().toISOString()),
        totalPurchase: v.totalPurchase ?? 0,
        totalPaid: v.totalPaid ?? 0,
        remainingBalance: v.remainingBalance ?? 0,
        paymentStatus: (v.paymentStatus as Vendor['paymentStatus']) ?? 'paid',
        dueDate: v.dueDate,
      });

      setLedger(ledgerData);
      setPurchases(purchasesData);
      setPayments(paymentsData);
    } catch (e) {
      console.error('Error fetching vendor:', e);
      setError('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleAddPayment = async () => {
    if (!vendor || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    setPaymentLoading(true);
    try {
      const paymentData: CreatePaymentData = {
        vendorId: vendor._id,
        purchaseId: selectedPurchaseId || undefined,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        paymentDate: new Date().toISOString(),
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await vendorService.createPayment(paymentData);

      // Refresh data
      await fetchVendorData();

      // Reset and close modal
      setSelectedPurchaseId('');
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

  // Get pending purchases for payment modal
  const pendingPurchases = purchases.filter(p => p.pendingAmount > 0);

  // Get selected purchase details
  const selectedPurchase = selectedPurchaseId
    ? purchases.find(p => p._id === selectedPurchaseId)
    : null;

  const getPaymentStatusBadge = (status: string | undefined, balance: number | undefined) => {
    if (!balance || balance <= 0) {
      return (
        <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Fully Paid
        </span>
      );
    }

    switch (status) {
      case 'overdue':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Overdue
          </span>
        );
      case 'partial':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Partial Payment
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Paid
          </span>
        );
    }
  };

  // Build ledger from purchases and payments if API doesn't return it
  const computedLedger = (): LedgerEntry[] => {
    if (ledger.length > 0) return ledger;

    const entries: LedgerEntry[] = [];

    // Add purchases
    purchases.forEach((p) => {
      entries.push({
        _id: p._id,
        date: p.purchaseDate,
        invoiceNumber: p.invoiceNumber,
        type: 'purchase',
        debit: p.total,
        credit: 0,
        balance: 0, // Will calculate running balance
        description: `Purchase - ${p.items.length} item(s)`,
      });
    });

    // Add payments
    payments.forEach((pay) => {
      entries.push({
        _id: pay._id,
        date: pay.paymentDate,
        invoiceNumber: pay.reference || '-',
        type: 'payment',
        debit: 0,
        credit: pay.amount,
        balance: 0,
        description: `Payment via ${pay.paymentMethod}`,
        reference: pay.reference,
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    entries.forEach((entry) => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return entries;
  };

  const downloadLedgerPdf = () => {
    if (!vendor) return;

    const doc = new jsPDF();
    const entries = computedLedger();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('VENDOR LEDGER', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(vendor.name, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Purchase: Rs ${(vendor.totalPurchase ?? 0).toLocaleString()}`, 14, yPos);
    doc.text(`Total Paid: Rs ${(vendor.totalPaid ?? 0).toLocaleString()}`, 80, yPos);
    doc.text(`Balance: Rs ${(vendor.remainingBalance ?? 0).toLocaleString()}`, 140, yPos);
    yPos += 12;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 4, 182, 8, 'F');
    doc.text('Date', 16, yPos);
    doc.text('Invoice No', 45, yPos);
    doc.text('Description', 80, yPos);
    doc.text('Debit', 125, yPos);
    doc.text('Credit', 150, yPos);
    doc.text('Balance', 175, yPos);
    yPos += 8;

    // Draw line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos - 3, 196, yPos - 3);

    // Table rows
    doc.setFont('helvetica', 'normal');
    entries.forEach((entry) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(formatDate(entry.date), 16, yPos);
      doc.text(entry.invoiceNumber.slice(0, 15), 45, yPos);
      doc.text(entry.description.slice(0, 25), 80, yPos);
      doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : '-', 125, yPos);
      doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : '-', 150, yPos);
      doc.text(entry.balance.toLocaleString(), 175, yPos);
      yPos += 6;
    });

    // Totals
    yPos += 5;
    doc.setFillColor(50, 50, 50);
    doc.rect(14, yPos - 4, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('CLOSING BALANCE', 16, yPos + 2);
    doc.text(`Rs ${(vendor.remainingBalance ?? 0).toLocaleString()}`, 175, yPos + 2);
    doc.setTextColor(0, 0, 0);

    doc.save(`Ledger_${vendor.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error || 'Vendor not found'}
      </div>
    );
  }

  const ledgerEntries = computedLedger();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/vendors"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{vendor.category || 'General Vendor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVendorData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <Link
            href={`/dashboard/vendors/edit/${vendor._id}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
          <Link
            href={`/dashboard/purchases/create?vendorId=${vendor._id}`}
            className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Add Purchase
          </Link>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Vendor Info & Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#dc2626]/10 rounded-full">
              <Truck className="h-6 w-6 text-[#dc2626]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Contact Information</h3>
              <p className="text-sm text-gray-500">{vendor.contactPerson}</p>
            </div>
          </div>

          <div className="space-y-3">
            {vendor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{vendor.phone}</span>
              </div>
            )}
            {vendor.address?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {[vendor.address.city, vendor.address.state, vendor.address.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Added {formatDate(vendor.createdAt)}</span>
            </div>
          </div>

          {vendor.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Account Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Purchase</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(vendor.totalPurchase ?? 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">{purchases.length} invoices</p>
          </div>

          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(vendor.totalPaid ?? 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">{payments.length} payments</p>
          </div>

          <div className={`rounded-lg border p-4 ${(vendor.remainingBalance ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`h-5 w-5 ${(vendor.remainingBalance ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${(vendor.remainingBalance ?? 0) > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                Remaining Balance
              </span>
            </div>
            <p className={`text-2xl font-bold ${(vendor.remainingBalance ?? 0) > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {formatCurrency(vendor.remainingBalance ?? 0)}
            </p>
            <div className="mt-1">
              {getPaymentStatusBadge(vendor.paymentStatus, vendor.remainingBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Account Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No / Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">
                  Debit (Purchase)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">
                  Credit (Payment)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a purchase or payment to start tracking
                    </p>
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{entry.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.type === 'purchase' ? (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Purchase</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Payment</span>
                        )}
                        <span className="text-sm text-gray-600">{entry.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {entry.debit > 0 ? (
                        <span className="text-sm font-medium text-red-600">{formatCurrency(entry.debit)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {entry.credit > 0 ? (
                        <span className="text-sm font-medium text-green-600">{formatCurrency(entry.credit)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${entry.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(entry.balance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ledgerEntries.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                    Closing Balance
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                    {formatCurrency(vendor.totalPurchase ?? 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                    {formatCurrency(vendor.totalPaid ?? 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(vendor.remainingBalance ?? 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>

            {/* Pending Invoices */}
            {pendingPurchases.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Invoice to Pay
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-red-600 uppercase">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingPurchases.map((purchase) => (
                        <tr
                          key={purchase._id}
                          className={`cursor-pointer hover:bg-gray-50 ${selectedPurchaseId === purchase._id ? 'bg-green-50' : ''}`}
                          onClick={() => {
                            setSelectedPurchaseId(purchase._id);
                            setPaymentAmount(purchase.pendingAmount.toString());
                          }}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="radio"
                              name="purchase"
                              checked={selectedPurchaseId === purchase._id}
                              onChange={() => {
                                setSelectedPurchaseId(purchase._id);
                                setPaymentAmount(purchase.pendingAmount.toString());
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{purchase.invoiceNumber}</td>
                          <td className="px-3 py-2 text-gray-600">{formatDate(purchase.purchaseDate)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(purchase.total)}</td>
                          <td className="px-3 py-2 text-right text-green-600">{formatCurrency(purchase.paidAmount)}</td>
                          <td className="px-3 py-2 text-right font-bold text-red-600">{formatCurrency(purchase.pendingAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on an invoice to select it. You can pay the full amount or a partial amount.
                </p>
              </div>
            )}

            {pendingPurchases.length === 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-medium">All invoices are fully paid!</p>
                <p className="text-sm text-green-600">This payment will be recorded as advance payment.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount <span className="text-red-500">*</span>
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
                    step="1"
                  />
                </div>
                {selectedPurchase && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedPurchase.pendingAmount.toString())}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Full ({formatCurrency(selectedPurchase.pendingAmount)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount((selectedPurchase.pendingAmount / 2).toFixed(0))}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Half ({formatCurrency(selectedPurchase.pendingAmount / 2)})
                    </button>
                  </div>
                )}
                {!selectedPurchaseId && (vendor.remainingBalance ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total outstanding: {formatCurrency(vendor.remainingBalance ?? 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference / Receipt No
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            {/* Payment Summary */}
            {selectedPurchase && paymentAmount && parseFloat(paymentAmount) > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Invoice:</span>
                  <span className="font-medium">{selectedPurchase.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Current Pending:</span>
                  <span className="font-medium text-red-600">{formatCurrency(selectedPurchase.pendingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">This Payment:</span>
                  <span className="font-medium text-green-600">{formatCurrency(parseFloat(paymentAmount))}</span>
                </div>
                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                  <span className="text-gray-600">After Payment:</span>
                  <span className={`font-bold ${selectedPurchase.pendingAmount - parseFloat(paymentAmount) <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatCurrency(Math.max(0, selectedPurchase.pendingAmount - parseFloat(paymentAmount)))}
                    {selectedPurchase.pendingAmount - parseFloat(paymentAmount) <= 0 && ' (Fully Paid)'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedPurchaseId('');
                  setPaymentAmount('');
                }}
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
