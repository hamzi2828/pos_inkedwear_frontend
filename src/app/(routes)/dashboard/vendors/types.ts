export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Vendor {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  address: Address;
  category: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Ledger fields
  totalPurchase?: number;
  totalPaid?: number;
  remainingBalance?: number;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDate?: string;
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface RawVendor {
  _id: string | number;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string | null;
  address?: Partial<Address>;
  category?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  totalPurchase?: number;
  totalPaid?: number;
  remainingBalance?: number;
  paymentStatus?: string;
  dueDate?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface CreateVendorData {
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: Partial<Address>;
  category?: string;
  notes?: string;
}

export interface UpdateVendorData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: Partial<Address>;
  category?: string;
  notes?: string;
  isActive?: boolean;
}

// Purchase / Transaction types
export interface Purchase {
  _id: string;
  vendorId: string;
  vendor?: Vendor;
  invoiceNumber: string;
  purchaseDate: string;
  dueDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface PurchaseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  _id: string;
  vendorId: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'cheque' | 'other';
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

// Ledger entry for display
export interface LedgerEntry {
  _id: string;
  date: string;
  invoiceNumber: string;
  type: 'purchase' | 'payment';
  debit: number; // Purchase amount
  credit: number; // Payment amount
  balance: number; // Running balance
  description: string;
  reference?: string;
}

// Dashboard stats
export interface VendorDashboardStats {
  totalVendors: number;
  totalPayable: number;
  totalOverdue: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface CreatePurchaseData {
  vendorId: string;
  invoiceNumber: string;
  purchaseDate: string;
  dueDate?: string;
  items: Omit<PurchaseItem, 'total'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface CreatePaymentData {
  vendorId: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'cheque' | 'other';
  paymentDate: string;
  reference?: string;
  notes?: string;
}
