// Sales Types and Interfaces

export interface SalesCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface SalesOrderItem {
  product: string | { _id: string; name: string; thumbnailUrl?: string };
  productName?: string; // Denormalized product name for display
  variantId?: string;
  sku: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  discount?: number;
  isLabour?: boolean;
  labourDescription?: string;
  isOutsource?: boolean;
  outsourceDescription?: string;
  costPrice?: number; // Cost price for outsource products
}

export type PaymentMethodType = 'cash' | 'card' | 'split' | 'bank_transfer';
export type PaymentStatusType = 'completed' | 'pending' | 'partial' | 'refunded';

export interface AppliedTax {
  name: string;
  rate: number;
  amount: number;
}

// Payment History Entry
export interface PaymentHistoryEntry {
  _id?: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  paidAt: string;
  receivedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  note?: string;
  bankTransferScreenshot?: string;
}

export interface SalesOrder {
  _id: string;
  orderNumber: string;
  items: SalesOrderItem[];
  customer?: SalesCustomer;
  paymentMethod: PaymentMethodType;
  cashAmount?: number;
  cardAmount?: number;
  changeGiven?: number;
  bankTransferScreenshot?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  appliedTaxes?: AppliedTax[];
  // Partial Payment Fields
  paidAmount?: number;
  pendingAmount?: number;
  paymentHistory?: PaymentHistoryEntry[];
  cashier?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  orderStatus: string;
  paymentStatus: PaymentStatusType;
  completedAt?: string;
}

export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  cardSales: number;
  bankSales: number;
  averageOrderValue: number;
  // Pending Payment Stats
  pendingAmount?: number;
  pendingOrders?: number;
}

export interface GetSalesOrdersResponse {
  success: boolean;
  data: SalesOrder[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  message?: string;
}

export type DateFilterType = 'today' | 'week' | 'month' | 'all' | 'custom';
