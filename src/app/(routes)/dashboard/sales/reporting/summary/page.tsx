// Admin Reporting Summary Page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { SalesOrder, SalesStats } from '../../types';
import { fetchSalesOrders, calculateSalesStats, getStoreSettings } from '../../services/salesService';
import { downloadSalesSummaryPdf } from '../../utils/invoicePdfGenerator';
import { getCurrencySymbol } from '@/helper/helper';
import { expenseService } from '../../../expenses/service/expenseService';
import { Expense } from '../../../expenses/types';
import { productService, ProductUI } from '../../../products/services/productService';

export default function SummaryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateFilter = searchParams.get('dateFilter') || 'all';
  const customStartDate = searchParams.get('startDate') || '';
  const customEndDate = searchParams.get('endDate') || '';
  const paymentFilter = searchParams.get('payment') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>('Inked Wear');
  const [currency, setCurrency] = useState<string>('PKR');
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalOrders: 0,
    cashSales: 0,
    cardSales: 0,
    bankSales: 0,
    averageOrderValue: 0,
  });
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [productCostMap, setProductCostMap] = useState<Map<string, number>>(new Map());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [settingsData, allProducts, allExpenses] = await Promise.all([
        getStoreSettings(),
        productService.listProducts(),
        expenseService.getExpenses()
      ]);

      if (settingsData?.storeName) {
        setStoreName(settingsData.storeName);
      }
      if (settingsData?.currency) {
        setCurrency(settingsData.currency);
      }

      // Create product cost map
      const costMap = new Map<string, number>();
      allProducts.forEach((product: ProductUI) => {
        if (product.costPrice !== undefined && product.costPrice !== null) {
          costMap.set(product.id, product.costPrice);
        }
      });
      setProductCostMap(costMap);

      const now = new Date();
      let params: { date?: string; startDate?: string; endDate?: string; limit: number } = {
        limit: 500,
      };
      let expenseStartDate: string | undefined;
      let expenseEndDate: string | undefined;

      if (dateFilter === 'today') {
        params.date = now.toISOString().split('T')[0];
        expenseStartDate = params.date;
        expenseEndDate = params.date;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
        expenseStartDate = params.startDate;
        expenseEndDate = params.endDate;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
        expenseStartDate = params.startDate;
        expenseEndDate = params.endDate;
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          params.startDate = customStartDate;
          params.endDate = customEndDate;
          expenseStartDate = customStartDate;
          expenseEndDate = customEndDate;
        }
      }

      // Filter expenses by date range
      let filteredExpenses = allExpenses;
      if (expenseStartDate && expenseEndDate) {
        const start = new Date(expenseStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(expenseEndDate);
        end.setHours(23, 59, 59, 999);

        filteredExpenses = allExpenses.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        });
      }
      const expensesTotal = filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
      setTotalExpenses(expensesTotal);

      const { orders: fetchedOrders } = await fetchSalesOrders(params);

      // Apply filters
      const filteredOrders = fetchedOrders.filter((order: SalesOrder) => {
        const matchesSearch = searchQuery === '' ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;

        return matchesSearch && matchesPayment;
      });

      setOrders(filteredOrders);
      setStats(calculateSalesStats(filteredOrders));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate, paymentFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const symbol = getCurrencySymbol(currency);

  const handleDownload = () => {
    if (orders.length > 0) {
      downloadSalesSummaryPdf(orders, {
        storeName,
        currency,
        totalExpenses,
        totalProductCost: totalCostPrice,
        productCostMap,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push('/dashboard/sales/reporting');
  };

  // Get display label for the current date range
  const getDateRangeLabel = (): string => {
    switch (dateFilter) {
      case 'today':
        return "Today";
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  // Calculate product cost using product cost map
  const getOrderCostPrice = (order: SalesOrder): number => {
    return order.items.reduce((sum, item) => {
      // For outsource items, use the saved costPrice
      if (item.isOutsource && item.costPrice) {
        return sum + (item.costPrice * item.quantity);
      }
      // For regular products, look up costPrice from products
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      if (productId && productCostMap.has(productId)) {
        const costPrice = productCostMap.get(productId) || 0;
        return sum + (costPrice * item.quantity);
      }
      return sum;
    }, 0);
  };

  const totalCostPrice = orders.reduce((sum, order) => sum + getOrderCostPrice(order), 0);

  // Calculate profit (Total Sales - Expenses - Product Cost)
  const profit = stats.totalSales - totalExpenses - totalCostPrice;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading summary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Controls - Hidden when printing */}
      <div className="max-w-4xl mx-auto mb-4 px-4 print:hidden">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">SALES SUMMARY</h1>
              <p className="text-gray-300 mt-1">{getDateRangeLabel()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{storeName}</p>
              <p className="text-sm text-gray-300">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-green-900">{symbol}{stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Average Order</p>
              <p className="text-2xl font-bold text-purple-900">{symbol}{stats.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
            <span className="text-sm text-gray-500">({getDateRangeLabel()})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">{symbol}{stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Expenses</p>
              <p className="text-xl font-bold text-red-600">{symbol}{totalExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Product Cost</p>
              <p className="text-xl font-bold text-orange-600">{symbol}{totalCostPrice.toFixed(2)}</p>
            </div>
            <div className={`bg-white border rounded-lg p-4 ${profit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <p className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Profit</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{symbol}{profit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders ({orders.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-orange-600 uppercase">Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const orderCost = getOrderCostPrice(order);
                  const orderDate = new Date(order.createdAt);

                  return (
                    <tr key={order._id}>
                      <td className="px-3 py-2 font-mono text-xs">{order.orderNumber}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        <div>{orderDate.toLocaleDateString()}</div>
                        <div className="text-gray-400">{orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Walk-in'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                          order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-orange-600">
                        {orderCost > 0 ? `${symbol}${orderCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs">
                        {symbol}{order.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase">Totals</td>
                  <td className="px-3 py-2 text-right font-bold text-sm text-orange-600">
                    {symbol}{totalCostPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-sm">
                    {symbol}{stats.totalSales.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-700">Cash</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{symbol}{stats.cashSales.toFixed(2)}</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-700">Card</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{symbol}{stats.cardSales.toFixed(2)}</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-700">Bank Transfer</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{symbol}{stats.bankSales.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-gray-500 border-t bg-gray-50">
          <p>Report generated on {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
