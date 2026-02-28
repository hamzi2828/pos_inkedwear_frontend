// POS Order Service
import { getAuthHeader } from "@/helper/helper";
import { CreateOrderResponse, GetOrdersResponse, POSOrder, POSOrderData, PendingOrdersResponse, AddPaymentRequest } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Create a POS order
 */
export async function createPOSOrder(orderData: POSOrderData): Promise<POSOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const url = `${API_BASE_URL}/api/pos/orders`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create order' }));
    throw new Error(error.message || 'Failed to create order');
  }

  const response: CreateOrderResponse = await res.json();
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
}

/**
 * Get POS orders (today's orders by default)
 */
export async function getPOSOrders(
  date?: string,
  limit?: number
): Promise<{ orders: POSOrder[]; total: number }> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (limit) params.append('limit', limit.toString());

  const url = `${API_BASE_URL}/api/pos/orders${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch orders' }));
    throw new Error(error.message || 'Failed to fetch orders');
  }

  const response: GetOrdersResponse = await res.json();
  return {
    orders: response.data || [],
    total: response.pagination?.total || 0,
  };
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<POSOrder | null> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const url = `${API_BASE_URL}/api/pos/orders/${orderId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    return null;
  }

  const response = await res.json();
  return response.data || null;
}

// Alias for clarity
export const getPOSOrderById = getOrderById;

/**
 * Get store settings
 */
export async function getSettings(): Promise<{ currency: string; storeName: string } | null> {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeader(),
    });

    if (res.ok) {
      const data = await res.json();
      return data.data || null;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return null;
}

/**
 * Get pending payment orders
 */
export async function getPendingOrders(customerId?: string): Promise<PendingOrdersResponse> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const params = new URLSearchParams();
  if (customerId) params.append('customerId', customerId);

  const url = `${API_BASE_URL}/api/pos/orders/pending${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch pending orders' }));
    throw new Error(error.message || 'Failed to fetch pending orders');
  }

  const response: PendingOrdersResponse = await res.json();
  return response;
}

/**
 * Add payment to an existing order
 */
export async function addPaymentToOrder(
  orderId: string,
  paymentData: AddPaymentRequest
): Promise<POSOrder> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const url = `${API_BASE_URL}/api/pos/orders/${orderId}/payment`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(paymentData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to add payment' }));
    throw new Error(error.message || 'Failed to add payment');
  }

  const response = await res.json();
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
}
