import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type {
  CreateVendorData,
  UpdateVendorData,
  CreatePurchaseData,
  CreatePaymentData,
  Purchase,
  Payment,
  LedgerEntry,
  VendorDashboardStats,
  PurchaseItem
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Local storage keys
const PURCHASES_KEY = 'vendor_purchases';
const PAYMENTS_KEY = 'vendor_payments';
const DELETED_VENDORS_KEY = 'deleted_vendors';

// Helper functions for deleted vendors
const getDeletedVendorIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(DELETED_VENDORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveDeletedVendorIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DELETED_VENDORS_KEY, JSON.stringify(ids));
};

// Helper functions for local storage
const getLocalPurchases = (): Purchase[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PURCHASES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalPurchases = (purchases: Purchase[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
};

const getLocalPayments = (): Payment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalPayments = (payments: Payment[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calculate vendor totals from local data
const calculateVendorTotals = (vendorId: string) => {
  const purchases = getLocalPurchases().filter(p => p.vendorId === vendorId && !p.isDeleted);
  const payments = getLocalPayments().filter(p => p.vendorId === vendorId);

  const totalPurchase = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalPurchase - totalPaid;

  let paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' = 'paid';
  if (remainingBalance > 0) {
    if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }
    // Check if any purchase is overdue
    const now = new Date();
    const hasOverdue = purchases.some(p => p.dueDate && new Date(p.dueDate) < now && p.pendingAmount > 0);
    if (hasOverdue) {
      paymentStatus = 'overdue';
    }
  }

  return { totalPurchase, totalPaid, remainingBalance, paymentStatus };
};

export const vendorService = {
  // Get all vendors
  async getVendors(includeDeleted = false) {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      let vendors = response.data?.data ?? response.data ?? [];

      // Filter out soft-deleted vendors
      if (!includeDeleted) {
        const deletedIds = getDeletedVendorIds();
        vendors = vendors.filter((v: any) => !deletedIds.includes(String(v._id)));
      }

      // Enhance vendors with local purchase/payment data
      return vendors.map((v: any) => {
        const totals = calculateVendorTotals(String(v._id));
        return {
          ...v,
          totalPurchase: totals.totalPurchase,
          totalPaid: totals.totalPaid,
          remainingBalance: totals.remainingBalance,
          paymentStatus: totals.paymentStatus,
        };
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get single vendor
  async getVendor(vendorId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/${vendorId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const vendor = response.data?.data ?? response.data;

      // Enhance with local purchase/payment data
      const totals = calculateVendorTotals(vendorId);
      return {
        ...vendor,
        totalPurchase: totals.totalPurchase,
        totalPaid: totals.totalPaid,
        remainingBalance: totals.remainingBalance,
        paymentStatus: totals.paymentStatus,
      };
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  // Create vendor
  async createVendor(vendorData: CreateVendorData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/vendors`, vendorData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Update vendor
  async updateVendor(vendorId: string, vendorData: UpdateVendorData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/vendors/${vendorId}`, vendorData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  // Soft delete vendor (adds to local deleted list)
  async deleteVendor(vendorId: string) {
    try {
      // Add to local soft-deleted list
      const deletedIds = getDeletedVendorIds();
      if (!deletedIds.includes(vendorId)) {
        deletedIds.push(vendorId);
        saveDeletedVendorIds(deletedIds);
      }

      // Also soft-delete all purchases for this vendor
      const purchases = getLocalPurchases();
      const updatedPurchases = purchases.map(p => {
        if (p.vendorId === vendorId && !p.isDeleted) {
          return {
            ...p,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      saveLocalPurchases(updatedPurchases);

      return { success: true, message: 'Vendor soft-deleted successfully' };
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  // Restore soft-deleted vendor
  async restoreVendor(vendorId: string) {
    const deletedIds = getDeletedVendorIds();
    const filtered = deletedIds.filter(id => id !== vendorId);
    saveDeletedVendorIds(filtered);

    // Also restore purchases for this vendor
    const purchases = getLocalPurchases();
    const updatedPurchases = purchases.map(p => {
      if (p.vendorId === vendorId && p.isDeleted) {
        return {
          ...p,
          isDeleted: false,
          deletedAt: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveLocalPurchases(updatedPurchases);

    return { success: true, message: 'Vendor restored successfully' };
  },

  // Get soft-deleted vendors
  async getDeletedVendors() {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const allVendors = response.data?.data ?? response.data ?? [];
      const deletedIds = getDeletedVendorIds();

      return allVendors.filter((v: any) => deletedIds.includes(String(v._id)));
    } catch (error) {
      console.error('Error fetching deleted vendors:', error);
      return [];
    }
  },

  // Update vendor status
  async updateVendorStatus(vendorId: string, isActive: boolean) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/vendors/${vendorId}/status`,
        { isActive },
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw error;
    }
  },

  // ============ PURCHASE METHODS (Local Storage) ============

  // Get all purchases
  async getPurchases(params?: { vendorId?: string; startDate?: string; endDate?: string; includeDeleted?: boolean }): Promise<Purchase[]> {
    let purchases = getLocalPurchases();

    // Filter out deleted purchases by default
    if (!params?.includeDeleted) {
      purchases = purchases.filter(p => !p.isDeleted);
    }

    // Filter by vendor
    if (params?.vendorId) {
      purchases = purchases.filter(p => p.vendorId === params.vendorId);
    }

    // Filter by date range
    if (params?.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      purchases = purchases.filter(p => new Date(p.purchaseDate) >= start);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      purchases = purchases.filter(p => new Date(p.purchaseDate) <= end);
    }

    // Sort by date descending
    purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    // Attach vendor info
    try {
      const vendors = await this.getVendors();
      purchases = purchases.map(p => ({
        ...p,
        vendor: vendors.find((v: any) => v._id === p.vendorId),
      }));
    } catch {
      // Continue without vendor info
    }

    return purchases;
  },

  // Get single purchase
  async getPurchase(purchaseId: string): Promise<Purchase> {
    const purchases = getLocalPurchases();
    const purchase = purchases.find(p => p._id === purchaseId);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    // Attach vendor info
    try {
      const vendor = await this.getVendor(purchase.vendorId);
      return { ...purchase, vendor };
    } catch {
      return purchase;
    }
  },

  // Create purchase
  async createPurchase(purchaseData: CreatePurchaseData): Promise<Purchase> {
    const purchases = getLocalPurchases();

    // Calculate item totals
    const items: PurchaseItem[] = purchaseData.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = purchaseData.tax || 0;
    const discountAmount = purchaseData.discount || 0;
    const total = subtotal + taxAmount - discountAmount;

    const newPurchase: Purchase = {
      _id: generateId(),
      vendorId: purchaseData.vendorId,
      invoiceNumber: purchaseData.invoiceNumber,
      purchaseDate: purchaseData.purchaseDate,
      dueDate: purchaseData.dueDate,
      items,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      paidAmount: 0,
      pendingAmount: total,
      paymentStatus: 'pending',
      notes: purchaseData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    purchases.push(newPurchase);
    saveLocalPurchases(purchases);

    return newPurchase;
  },

  // Update purchase
  async updatePurchase(purchaseId: string, purchaseData: Partial<CreatePurchaseData>): Promise<Purchase> {
    const purchases = getLocalPurchases();
    const index = purchases.findIndex(p => p._id === purchaseId);

    if (index === -1) {
      throw new Error('Purchase not found');
    }

    const existing = purchases[index];
    let items = existing.items;

    if (purchaseData.items) {
      items = purchaseData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = purchaseData.tax ?? existing.tax;
    const discountAmount = purchaseData.discount ?? existing.discount;
    const total = subtotal + taxAmount - discountAmount;

    const updated: Purchase = {
      ...existing,
      vendorId: purchaseData.vendorId ?? existing.vendorId,
      invoiceNumber: purchaseData.invoiceNumber ?? existing.invoiceNumber,
      purchaseDate: purchaseData.purchaseDate ?? existing.purchaseDate,
      dueDate: purchaseData.dueDate ?? existing.dueDate,
      items,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      pendingAmount: total - existing.paidAmount,
      notes: purchaseData.notes ?? existing.notes,
      updatedAt: new Date().toISOString(),
    };

    // Update payment status
    if (updated.pendingAmount <= 0) {
      updated.paymentStatus = 'paid';
    } else if (updated.paidAmount > 0) {
      updated.paymentStatus = 'partial';
    }

    purchases[index] = updated;
    saveLocalPurchases(purchases);

    return updated;
  },

  // Soft delete purchase
  async deletePurchase(purchaseId: string) {
    const purchases = getLocalPurchases();
    const index = purchases.findIndex(p => p._id === purchaseId);

    if (index !== -1) {
      purchases[index] = {
        ...purchases[index],
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveLocalPurchases(purchases);
    }

    return { success: true };
  },

  // Restore soft-deleted purchase
  async restorePurchase(purchaseId: string) {
    const purchases = getLocalPurchases();
    const index = purchases.findIndex(p => p._id === purchaseId);

    if (index !== -1) {
      purchases[index] = {
        ...purchases[index],
        isDeleted: false,
        deletedAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      saveLocalPurchases(purchases);
    }

    return { success: true };
  },

  // Permanently delete purchase (hard delete)
  async permanentlyDeletePurchase(purchaseId: string) {
    const purchases = getLocalPurchases();
    const filtered = purchases.filter(p => p._id !== purchaseId);
    saveLocalPurchases(filtered);

    // Also delete related payments
    const payments = getLocalPayments();
    const filteredPayments = payments.filter(p => p.purchaseId !== purchaseId);
    saveLocalPayments(filteredPayments);

    return { success: true };
  },

  // ============ PAYMENT METHODS (Local Storage) ============

  // Get payments
  async getPayments(params?: { vendorId?: string; purchaseId?: string }): Promise<Payment[]> {
    let payments = getLocalPayments();

    if (params?.vendorId) {
      payments = payments.filter(p => p.vendorId === params.vendorId);
    }
    if (params?.purchaseId) {
      payments = payments.filter(p => p.purchaseId === params.purchaseId);
    }

    // Sort by date descending
    payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return payments;
  },

  // Create payment
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    const payments = getLocalPayments();

    const newPayment: Payment = {
      _id: generateId(),
      vendorId: paymentData.vendorId,
      purchaseId: paymentData.purchaseId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      reference: paymentData.reference,
      notes: paymentData.notes,
      createdAt: new Date().toISOString(),
    };

    payments.push(newPayment);
    saveLocalPayments(payments);

    // Update purchase paid amount if linked to a purchase
    if (paymentData.purchaseId) {
      const purchases = getLocalPurchases();
      const purchaseIndex = purchases.findIndex(p => p._id === paymentData.purchaseId);

      if (purchaseIndex !== -1) {
        const purchase = purchases[purchaseIndex];
        purchase.paidAmount += paymentData.amount;
        purchase.pendingAmount = purchase.total - purchase.paidAmount;

        if (purchase.pendingAmount <= 0) {
          purchase.paymentStatus = 'paid';
          purchase.pendingAmount = 0;
        } else {
          purchase.paymentStatus = 'partial';
        }

        purchase.updatedAt = new Date().toISOString();
        purchases[purchaseIndex] = purchase;
        saveLocalPurchases(purchases);
      }
    }

    return newPayment;
  },

  // Delete payment
  async deletePayment(paymentId: string) {
    const payments = getLocalPayments();
    const payment = payments.find(p => p._id === paymentId);

    if (payment && payment.purchaseId) {
      // Update purchase
      const purchases = getLocalPurchases();
      const purchaseIndex = purchases.findIndex(p => p._id === payment.purchaseId);

      if (purchaseIndex !== -1) {
        const purchase = purchases[purchaseIndex];
        purchase.paidAmount -= payment.amount;
        purchase.pendingAmount = purchase.total - purchase.paidAmount;

        if (purchase.pendingAmount <= 0) {
          purchase.paymentStatus = 'paid';
        } else if (purchase.paidAmount > 0) {
          purchase.paymentStatus = 'partial';
        } else {
          purchase.paymentStatus = 'pending';
        }

        purchase.updatedAt = new Date().toISOString();
        purchases[purchaseIndex] = purchase;
        saveLocalPurchases(purchases);
      }
    }

    const filtered = payments.filter(p => p._id !== paymentId);
    saveLocalPayments(filtered);

    return { success: true };
  },

  // ============ LEDGER METHODS ============

  // Get vendor ledger
  async getVendorLedger(vendorId: string): Promise<LedgerEntry[]> {
    const purchases = getLocalPurchases().filter(p => p.vendorId === vendorId && !p.isDeleted);
    const payments = getLocalPayments().filter(p => p.vendorId === vendorId);

    const entries: LedgerEntry[] = [];

    // Add purchases as debit entries
    purchases.forEach(p => {
      entries.push({
        _id: p._id,
        date: p.purchaseDate,
        invoiceNumber: p.invoiceNumber,
        type: 'purchase',
        debit: p.total,
        credit: 0,
        balance: 0,
        description: `Purchase - ${p.items.length} item(s)`,
      });
    });

    // Add payments as credit entries
    payments.forEach(pay => {
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
    entries.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return entries;
  },

  // Get vendor dashboard stats
  async getVendorDashboardStats(): Promise<VendorDashboardStats> {
    try {
      // Get only non-deleted vendors
      const vendors = await this.getVendors(false);
      const purchases = getLocalPurchases().filter(p => !p.isDeleted);
      const payments = getLocalPayments();

      const totalPurchase = purchases.reduce((sum, p) => sum + p.total, 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPayable = totalPurchase - totalPaid;

      // Calculate overdue
      let totalOverdue = 0;
      let overdueCount = 0;
      let pendingCount = 0;
      let paidCount = 0;

      vendors.forEach((v: any) => {
        if (v.remainingBalance <= 0) {
          paidCount++;
        } else if (v.paymentStatus === 'overdue') {
          overdueCount++;
          totalOverdue += v.remainingBalance;
        } else {
          pendingCount++;
        }
      });

      return {
        totalVendors: vendors.length,
        totalPayable: Math.max(0, totalPayable),
        totalOverdue,
        pendingCount,
        paidCount,
        overdueCount,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalVendors: 0,
        totalPayable: 0,
        totalOverdue: 0,
        pendingCount: 0,
        paidCount: 0,
        overdueCount: 0,
      };
    }
  },
};
