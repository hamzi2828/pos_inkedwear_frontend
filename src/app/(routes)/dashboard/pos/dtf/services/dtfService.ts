// DTF Service - Direct-to-Film Printing
import { getAuthHeader } from "@/helper/helper";
import {
  DTFArtwork,
  DTFPricingResult,
  DTFPricingConfig,
  DTFOrder,
  DTFProductionStatus,
  DTFOrderFormData,
  CreateDTFOrderData,
  DTFOrdersByStatus,
} from "../../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Upload DTF artwork to blob storage
 */
export async function uploadDTFArtwork(
  file: File,
  dimensions: {
    width: number;
    height: number;
    dpi: number;
    colorProfile: string;
  }
): Promise<DTFArtwork> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const formData = new FormData();
  formData.append("artwork", file);
  formData.append("width", dimensions.width.toString());
  formData.append("height", dimensions.height.toString());
  formData.append("dpi", dimensions.dpi.toString());
  formData.append("colorProfile", dimensions.colorProfile);

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/upload-artwork`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message);
  }

  const response = await res.json();
  return response.data;
}

/**
 * Delete artwork from blob storage
 */
export async function deleteDTFArtwork(url: string): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/artwork`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message);
  }
}

/**
 * Upload bank transfer screenshot
 */
export async function uploadBankTransferScreenshot(
  file: File
): Promise<{ url: string; originalFilename: string; uploadedAt: string }> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const formData = new FormData();
  formData.append("screenshot", file);

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/upload-screenshot`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message);
  }

  const response = await res.json();
  return response.data;
}

/**
 * Calculate DTF pricing
 */
export async function calculateDTFPrice(
  orderDetails: Partial<DTFOrderFormData>
): Promise<DTFPricingResult> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/calculate-price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(orderDetails),
  });

  if (!res.ok) {
    throw new Error("Failed to calculate price");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Get pricing configuration
 */
export async function getDTFPricingConfig(): Promise<DTFPricingConfig> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/pricing-config`, {
    headers: { ...getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch pricing config");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Create DTF order
 */
export async function createDTFOrder(
  orderData: CreateDTFOrderData
): Promise<DTFOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to create order" }));
    throw new Error(error.message);
  }

  const response = await res.json();
  return response.data;
}

/**
 * Get DTF orders with optional filters
 */
export async function getDTFOrders(params?: {
  status?: DTFProductionStatus;
  limit?: number;
  page?: number;
}): Promise<{
  orders: DTFOrder[];
  total: number;
  pages: number;
}> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.page) searchParams.append("page", params.page.toString());

  const res = await fetch(
    `${API_BASE_URL}/api/pos/dtf/orders?${searchParams}`,
    {
      headers: { ...getAuthHeader() },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch DTF orders");
  }

  const response = await res.json();
  return {
    orders: response.data,
    total: response.pagination?.total || 0,
    pages: response.pagination?.pages || 1,
  };
}

/**
 * Get single DTF order by ID
 */
export async function getDTFOrderById(orderId: string): Promise<DTFOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/orders/${orderId}`, {
    headers: { ...getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch DTF order");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Get DTF orders grouped by production status (for kanban board)
 */
export async function getDTFOrdersByStatus(): Promise<DTFOrdersByStatus> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${API_BASE_URL}/api/pos/dtf/orders/by-status`, {
    headers: { ...getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch DTF orders by status");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Update DTF order production status
 */
export async function updateDTFOrderStatus(
  orderId: string,
  status: DTFProductionStatus,
  notes?: string
): Promise<DTFOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(
    `${API_BASE_URL}/api/pos/dtf/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status, notes }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update status");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Update DTF order details (full update)
 */
export interface UpdateDTFOrderData {
  jobName?: string;
  sheetType?: 'A3' | 'A4';
  filmType?: 'standard' | 'glitter' | 'reflective' | 'glow-in-dark';
  inkConfiguration?: 'standard' | 'fluorescent';
  garmentType?: 'cotton' | 'polyester' | 'blend';
  garmentColor?: 'light' | 'dark';
  quantity?: number;
  backgroundRemovalRequired?: boolean;
  isRushOrder?: boolean;
  dueDate?: string | null;
  dimensions?: {
    width?: number;
    height?: number;
  };
  productionStatus?: DTFProductionStatus;
  notes?: string;
  artworks?: Array<{
    customName: string;
    artwork: DTFArtwork;
  }>;
}

export async function updateDTFOrder(
  orderId: string,
  data: UpdateDTFOrderData
): Promise<DTFOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(
    `${API_BASE_URL}/api/pos/dtf/orders/${orderId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update order");
  }

  const response = await res.json();
  return response.data;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: DTFProductionStatus): string {
  const labels: Record<DTFProductionStatus, string> = {
    artwork_review: "Artwork Review",
    printing: "Printing",
    curing: "Curing",
    ready: "Ready",
    shipped: "Shipped",
    picked_up: "Picked Up",
  };
  return labels[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: DTFProductionStatus): string {
  const colors: Record<DTFProductionStatus, string> = {
    artwork_review: "bg-yellow-100 text-yellow-800",
    printing: "bg-blue-100 text-blue-800",
    curing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    shipped: "bg-purple-100 text-purple-800",
    picked_up: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get film type label
 */
export function getFilmTypeLabel(
  filmType: "standard" | "glitter" | "reflective" | "glow-in-dark"
): string {
  const labels = {
    standard: "Standard",
    glitter: "Glitter",
    reflective: "Reflective",
    "glow-in-dark": "Glow-in-Dark",
  };
  return labels[filmType] || filmType;
}

/**
 * Get garment type label
 */
export function getGarmentTypeLabel(
  garmentType: "cotton" | "polyester" | "blend"
): string {
  const labels = {
    cotton: "Cotton",
    polyester: "Polyester",
    blend: "Blend",
  };
  return labels[garmentType] || garmentType;
}
