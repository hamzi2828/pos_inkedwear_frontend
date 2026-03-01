// POS Types and Interfaces

export interface POSProduct {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number; // Cost price for profit calculation
  discountedPrice?: number;
  stock: number;
  category: string;
  thumbnailUrl?: string;
  bannerUrls?: string[];
  productType: 'single' | 'variant';
  variants?: POSVariant[];
  colorMedia?: Record<string, ColorMedia>;
}

export interface POSVariant {
  _id: string;
  variantId: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
  discountedPrice?: number;
}

export interface ColorMedia {
  thumbnailUrl?: string;
  bannerUrls?: string[];
}

export interface CartItem {
  id: string; // Unique cart item ID (generated client-side)
  product: POSProduct;
  variantId?: string;
  variant?: POSVariant;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  color?: string;
  size?: string;
  isLabour?: boolean;
  labourDescription?: string;
  isOutsource?: boolean;
  outsourceDescription?: string;
  costPrice?: number; // Cost price for outsource products (saved for records)
}

// Tax type for POS
export interface POSTax {
  taxId: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
}

// Applied tax in cart
export interface AppliedTax {
  taxId: string;
  name: string;
  rate: number;
  amount: number;
}

export interface POSCart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number; // Legacy: Total combined tax rate
  appliedTaxes: AppliedTax[]; // New: Individual applied taxes
  discount: number;
  discountType?: 'fixed' | 'percentage' | null;
  discountReason?: string;
  total: number;
  customer?: POSCustomer;
}

export interface POSCarDetails {
  brand: string;
  model: string;
  numberPlate: string;
}

export interface POSAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface POSCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  carDetails?: POSCarDetails | POSCarDetails[];
  address?: POSAddress;
}

export type PaymentMethodType = 'cash' | 'card' | 'split' | 'bank_transfer';

export interface PaymentMethod {
  type: PaymentMethodType;
  cashAmount?: number;
  cardAmount?: number;
  change?: number;
  stripePaymentIntentId?: string;
  bankTransferScreenshot?: string; // URL of uploaded screenshot
}

// Payment Status Types
export type PaymentStatusType = 'completed' | 'pending' | 'partial' | 'refunded';

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

// Bank transfer screenshot upload result
export interface BankTransferScreenshot {
  url: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface POSOrderItem {
  product?: string | { _id: string; name: string }; // Product ID or populated product
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
  costPrice?: number; // Cost price for outsource products (saved for records)
}

export interface CustomerInfo {
  name: string;
  phone: string;
  vehicleName: string;
}

export interface POSOrderData {
  items: POSOrderItem[];
  customer?: string; // User ID or undefined for guest
  customerInfo?: CustomerInfo; // Customer info for invoice display
  subtotal: number;
  tax: number;
  appliedTaxes?: AppliedTax[]; // Tax breakdown when multiple taxes applied
  discount: number;
  discountType?: 'fixed' | 'percentage' | null;
  discountReason?: string;
  total: number;
  paymentMethod: PaymentMethodType;
  cashAmount?: number;
  cardAmount?: number;
  change?: number;
  bankTransferScreenshot?: string; // URL of bank transfer screenshot
  isPOS: true;
  notes?: string;
  // Partial Payment Fields
  isPartialPayment?: boolean;
  paidAmount?: number;
}

export interface POSOrder {
  _id: string;
  orderNumber: string;
  orderType?: 'standard' | 'dtf'; // Order type - standard retail or DTF printing
  items: POSOrderItem[];
  customer?: POSCustomer;
  customerInfo?: CustomerInfo; // Customer info stored at time of order
  paymentMethod: PaymentMethodType;
  cashAmount?: number;
  cardAmount?: number;
  changeGiven?: number;
  bankTransferScreenshot?: string;
  subtotal: number;
  tax: number;
  appliedTaxes?: AppliedTax[]; // Tax breakdown when multiple taxes applied
  discount: number;
  total: number;
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
  // DTF specific fields (populated when orderType is 'dtf')
  dtfDetails?: DTFOrderDetails;
}

// Pending Orders Response
export interface PendingOrdersResponse {
  success: boolean;
  data: POSOrder[];
  summary: {
    totalOrders: number;
    totalPending: number;
    totalPaid: number;
    totalAmount: number;
  };
  message?: string;
}

// Add Payment Request
export interface AddPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethodType;
  note?: string;
  bankTransferScreenshot?: string;
}

export interface HeldCart {
  id: string;
  cart: POSCart;
  heldAt: string;
  heldBy: string;
  customerName?: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
  type: DiscountType;
  value: number;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface GetProductsResponse {
  success: boolean;
  data: POSProduct[];
  message?: string;
}

export interface GetUsersResponse {
  success: boolean;
  data: POSCustomer[];
  message?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  data: POSOrder;
  message?: string;
}

export interface GetOrdersResponse {
  success: boolean;
  data: POSOrder[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  message?: string;
}

// ==================== DTF Types ====================

export type DTFSheetType = 'A3' | 'A4';
export type DTFFilmType = 'standard' | 'glitter' | 'reflective' | 'glow-in-dark';
export type DTFInkConfig = 'standard' | 'fluorescent';
export type DTFGarmentType = 'cotton' | 'polyester' | 'blend';
export type DTFGarmentColor = 'light' | 'dark';
export type DTFProductionStatus =
  | 'artwork_review'
  | 'printing'
  | 'curing'
  | 'ready'
  | 'shipped'
  | 'picked_up';

export interface DTFArtwork {
  originalFilename: string;
  blobUrl: string;
  fileType: string;
  fileSizeBytes?: number;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
    isValidDpi: boolean;
  };
  colorProfile: 'RGB' | 'CMYK';
}

// Artwork item with custom name for multiple file uploads
export interface DTFArtworkItem {
  id: string; // Unique ID for tracking in UI
  customName: string; // User-provided name for the artwork
  file?: File; // Original file (before upload)
  artwork?: DTFArtwork; // Uploaded artwork data
  uploading?: boolean; // Upload status
  error?: string; // Upload error message
  pixelWidth?: number; // Image width in pixels
  pixelHeight?: number; // Image height in pixels
  calculatedDpi?: number; // Calculated DPI based on print dimensions
}

export interface DTFStatusHistoryItem {
  status: DTFProductionStatus;
  timestamp: string;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  notes?: string;
}

export interface DTFOrderDetails {
  jobName: string;
  artwork?: DTFArtwork; // Legacy single artwork
  artworks?: Array<{ customName: string; artwork: DTFArtwork }>; // Multiple artworks with names
  sheetType: DTFSheetType;
  filmType: DTFFilmType;
  inkConfiguration: DTFInkConfig;
  garmentType: DTFGarmentType;
  garmentColor: DTFGarmentColor;
  quantity: number;
  backgroundRemovalRequired: boolean;
  mirroredConfirmed: boolean;
  pricePerSquareInch?: number;
  squareInches?: number;
  basePrice?: number;
  setupFee?: number;
  rushFee?: number;
  isRushOrder: boolean;
  unitPrice?: number;
  dueDate?: string;
  productionStatus?: DTFProductionStatus;
  statusHistory?: DTFStatusHistoryItem[];
}

export interface DTFPricingResult {
  squareInches: number;
  pricePerSquareInch: number;
  unitPrice: number;
  basePrice: number;
  setupFee: number;
  rushFee: number;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  rushFeePercentage: number;
  backgroundRemovalFee: number;
  breakdown: {
    filmTypeMultiplier: number;
    inkMultiplier: number;
    quantity: number;
    isRushOrder: boolean;
    backgroundRemovalRequired: boolean;
  };
}

export interface DTFPricingConfig {
  baseRatePerSquareInch: number;
  filmTypeMultipliers: Record<DTFFilmType, number>;
  inkConfigMultipliers: Record<DTFInkConfig, number>;
  setupFee: {
    backgroundRemoval: number;
    artworkPrep: number;
  };
  rushFeePercentage: number;
  minimumOrder: number;
  taxRate: number;
}

export interface DTFOrder extends POSOrder {
  orderType: 'dtf';
  dtfDetails: DTFOrderDetails;
}

export interface DTFOrderFormData {
  jobName: string;
  artwork?: DTFArtwork; // Legacy single artwork
  artworks?: Array<{ customName: string; artwork: DTFArtwork }>; // Multiple artworks with names
  sheetType: DTFSheetType;
  filmType: DTFFilmType;
  inkConfiguration: DTFInkConfig;
  garmentType: DTFGarmentType;
  garmentColor: DTFGarmentColor;
  quantity: number;
  backgroundRemovalRequired: boolean;
  mirroredConfirmed: boolean;
  isRushOrder: boolean;
  dueDate?: string;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
    colorProfile: 'RGB' | 'CMYK';
  };
}

export interface CreateDTFOrderData {
  customer?: string;
  dtfDetails: DTFOrderFormData;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  cashAmount?: number;
  bankTransferScreenshot?: string; // URL of uploaded screenshot
  notes?: string;
  // Tax override fields (when using custom tax selection)
  subtotal?: number;
  tax?: number;
  total?: number;
  // Partial payment fields
  isPartialPayment?: boolean;
  paidAmount?: number;
}

export interface GetDTFOrdersResponse {
  success: boolean;
  data: DTFOrder[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface DTFOrdersByStatus {
  artwork_review: DTFOrder[];
  printing: DTFOrder[];
  curing: DTFOrder[];
  ready: DTFOrder[];
  shipped: DTFOrder[];
  picked_up: DTFOrder[];
}

