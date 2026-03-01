'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  RefreshCw,
  Clock,
  Printer,
  Flame,
  CheckCircle,
  Truck,
  Package,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
} from 'lucide-react';
import { DTFOrder, DTFProductionStatus, DTFOrdersByStatus } from '../../types';
import {
  getDTFOrdersByStatus,
  updateDTFOrderStatus,
} from '../services/dtfService';
import { formatCurrency, getAuthHeader } from '@/helper/helper';

interface StatusColumn {
  status: DTFProductionStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const statusColumns: StatusColumn[] = [
  { status: 'artwork_review', label: 'Artwork Review', icon: <Clock className="h-4 w-4" />, color: 'border-yellow-400' },
  { status: 'printing', label: 'Printing', icon: <Printer className="h-4 w-4" />, color: 'border-blue-400' },
  { status: 'curing', label: 'Curing', icon: <Flame className="h-4 w-4" />, color: 'border-orange-400' },
  { status: 'ready', label: 'Ready', icon: <CheckCircle className="h-4 w-4" />, color: 'border-green-400' },
  { status: 'shipped', label: 'Shipped', icon: <Truck className="h-4 w-4" />, color: 'border-purple-400' },
  { status: 'picked_up', label: 'Picked Up', icon: <Package className="h-4 w-4" />, color: 'border-gray-400' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DTFStatusTracker() {
  const [ordersByStatus, setOrdersByStatus] = useState<DTFOrdersByStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('PKR');

  // Load settings for currency
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
          headers: getAuthHeader(),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.currency) {
            setCurrency(data.data.currency);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getDTFOrdersByStatus();
      setOrdersByStatus(data);
    } catch (error) {
      console.error('Failed to load DTF orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleMoveToNextStatus = async (order: DTFOrder) => {
    const currentIndex = statusColumns.findIndex(
      col => col.status === order.dtfDetails?.productionStatus
    );
    if (currentIndex === -1 || currentIndex >= statusColumns.length - 1) return;

    const nextStatus = statusColumns[currentIndex + 1].status;

    try {
      setUpdatingOrder(order._id);
      await updateDTFOrderStatus(order._id, nextStatus);
      await loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleMoveToPreviousStatus = async (order: DTFOrder) => {
    const currentIndex = statusColumns.findIndex(
      col => col.status === order.dtfDetails?.productionStatus
    );
    if (currentIndex <= 0) return;

    const previousStatus = statusColumns[currentIndex - 1].status;

    try {
      setUpdatingOrder(order._id);
      await updateDTFOrderStatus(order._id, previousStatus);
      await loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Production Queue</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {statusColumns.map(column => (
          <div
            key={column.status}
            className={`flex-shrink-0 w-56 bg-gray-50 rounded-md border-t-3 ${column.color}`}
          >
            {/* Column Header */}
            <div className="px-2 py-1.5 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                {column.icon}
                <span className="font-medium text-gray-900 text-sm">{column.label}</span>
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {ordersByStatus?.[column.status]?.length || 0}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-1.5 space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
              {ordersByStatus?.[column.status]?.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onMoveNext={() => handleMoveToNextStatus(order)}
                  onMoveBack={() => handleMoveToPreviousStatus(order)}
                  isFirst={column.status === 'artwork_review'}
                  isLast={column.status === 'picked_up'}
                  isUpdating={updatingOrder === order._id}
                  currency={currency}
                />
              ))}

              {(!ordersByStatus?.[column.status] || ordersByStatus[column.status].length === 0) && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  No orders
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: DTFOrder;
  onMoveNext: () => void;
  onMoveBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isUpdating: boolean;
  currency: string;
}

function OrderCard({ order, onMoveNext, onMoveBack, isFirst, isLast, isUpdating, currency }: OrderCardProps) {
  const dtf = order.dtfDetails;
  const isOverdue = dtf?.dueDate && new Date(dtf.dueDate) < new Date();

  return (
    <div className={`bg-white rounded-md shadow-sm border p-2 ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 text-xs truncate">{dtf?.jobName || 'Untitled'}</p>
          <p className="text-[10px] text-gray-500">{order.orderNumber}</p>
        </div>
        {dtf?.isRushOrder && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded ml-1 flex-shrink-0">
            RUSH
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-0.5 text-[10px] text-gray-600 mb-1.5">
        {order.customer && (
          <div className="flex items-center gap-1 truncate">
            <User className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{order.customer.firstName} {order.customer.lastName}</span>
          </div>
        )}

        {dtf?.dueDate && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
            <span>
              {new Date(dtf.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {isOverdue && ' !'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 flex-wrap">
          <span className="bg-gray-100 px-1 py-0.5 rounded text-[9px]">{dtf?.sheetType}</span>
          <span className="bg-gray-100 px-1 py-0.5 rounded text-[9px]">{dtf?.filmType}</span>
          <span className="bg-gray-100 px-1 py-0.5 rounded text-[9px]">x{dtf?.quantity}</span>
        </div>
      </div>

      {/* Total & Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
        <span className="font-semibold text-gray-900 text-xs">{formatCurrency(order.total, currency)}</span>

        <div className="flex items-center gap-1">
          {!isFirst && (
            <button
              onClick={onMoveBack}
              disabled={isUpdating}
              className="flex items-center text-[10px] text-gray-600 hover:text-gray-800 disabled:opacity-50 p-0.5"
            >
              {isUpdating ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          )}

          {!isLast && (
            <button
              onClick={onMoveNext}
              disabled={isUpdating}
              className="flex items-center text-[10px] text-[#dc2626] hover:text-red-800 disabled:opacity-50 p-0.5"
            >
              {isUpdating ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
