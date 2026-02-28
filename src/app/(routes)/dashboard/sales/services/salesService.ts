// Sales Service - API calls for sales data
import { getAuthHeader } from '@/helper/helper';
import { SalesOrder, GetSalesOrdersResponse, SalesStats } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface FetchSalesParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
  paymentMethod?: string;
  orderType?: string;
}

/**
 * Fetch sales orders with optional filters
 */
export async function fetchSalesOrders(params: FetchSalesParams = {}): Promise<{
  orders: SalesOrder[];
  total: number;
  pagination?: { total: number; page: number; pages: number; limit: number };
}> {
  if (!API_BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
  }

  const searchParams = new URLSearchParams();

  if (params.date) searchParams.append('date', params.date);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.paymentMethod && params.paymentMethod !== 'all') {
    searchParams.append('paymentMethod', params.paymentMethod);
  }
  if (params.orderType && params.orderType !== 'all') {
    searchParams.append('orderType', params.orderType);
  }

  const url = `${API_BASE_URL}/api/pos/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch sales' }));
    throw new Error(error.message || 'Failed to fetch sales');
  }

  const data: GetSalesOrdersResponse = await response.json();

  return {
    orders: data.data || [],
    total: data.pagination?.total || data.data?.length || 0,
    pagination: data.pagination,
  };
}

/**
 * Get a single order by ID
 */
export async function getSalesOrderById(orderId: string): Promise<SalesOrder | null> {
  if (!API_BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
  }

  const response = await fetch(`${API_BASE_URL}/api/pos/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data || null;
}

/**
 * Calculate stats from orders
 */
export function calculateSalesStats(orders: SalesOrder[]): SalesStats {
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const cashSales = orders
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const cardSales = orders
    .filter(o => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);
  const bankSales = orders
    .filter(o => o.paymentMethod === 'bank_transfer')
    .reduce((sum, o) => sum + o.total, 0);

  // Calculate pending payment stats
  const pendingOrders = orders.filter(o => o.paymentStatus === 'pending' || o.paymentStatus === 'partial');
  const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.pendingAmount || 0), 0);

  return {
    totalSales,
    totalOrders: orders.length,
    cashSales,
    cardSales,
    bankSales,
    averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
    pendingAmount,
    pendingOrders: pendingOrders.length,
  };
}

/**
 * Soft delete a sales order
 */
export async function deleteSalesOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  if (!API_BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
  }

  const response = await fetch(`${API_BASE_URL}/api/pos/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete order');
  }

  return data;
}

/**
 * Get store settings
 */
export async function getStoreSettings(): Promise<{ storeName: string; currency: string } | null> {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeader(),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || null;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return null;
}
