// Admin Reporting Invoice Page
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SalesOrder } from '../../../../sales/types';
import { fetchSalesOrders, getStoreSettings } from '../../../../sales/services/salesService';
import { downloadSingleInvoicePdf } from '../../../../sales/utils/invoicePdfGenerator';
import { Printer, ArrowLeft, Download, Banknote, CreditCard, Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getCurrencySymbol } from '@/helper/helper';
import { productService, ProductUI } from '../../../../products/services/productService';

export default function AdminReportingInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('PKR');
  const [storeName, setStoreName] = useState<string>('Inked Wear');
  const [productCostMap, setProductCostMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, settingsData, allProducts] = await Promise.all([
          fetchSalesOrders({ limit: 500 }),
          getStoreSettings(),
          productService.listProducts()
        ]);

        // Build product cost map
        const costMap = new Map<string, number>();
        allProducts.forEach((product: ProductUI) => {
          if (product.id && product.costPrice) {
            costMap.set(product.id, product.costPrice);
          }
        });
        setProductCostMap(costMap);

        // Find the specific order by ID
        const foundOrder = ordersData.orders.find((o: SalesOrder) => o._id === orderId);

        if (foundOrder) {
          setOrder(foundOrder);
          // Set document title to order number for PDF filename
          document.title = foundOrder.orderNumber;
        } else {
          setError('Order not found');
        }

        if (settingsData?.currency) {
          setCurrency(settingsData.currency);
        }
        if (settingsData?.storeName) {
          setStoreName(settingsData.storeName);
        }
      } catch (err) {
        setError('Failed to load order');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const symbol = getCurrencySymbol(currency);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (order) {
      downloadSingleInvoicePdf(order, { storeName, currency });
    }
  };

  const handleBack = () => {
    router.push('/dashboard/reporting/sales');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Order not found'}</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Calculate cost price for all items (outsource and regular products)
  const getOrderCostPrice = (): number => {
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

  // Get cost for a single item and its type
  const getItemCostInfo = (item: typeof order.items[0]): { cost: number; type: 'outsource' | 'product' } | null => {
    if (item.isOutsource && item.costPrice) {
      return { cost: item.costPrice, type: 'outsource' };
    }
    if (!item.isLabour) {
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      if (productId && productCostMap.has(productId)) {
        return { cost: productCostMap.get(productId) || 0, type: 'product' };
      }
    }
    return null;
  };

  const totalCostPrice = getOrderCostPrice();
  const hasProductCosts = totalCostPrice > 0;

  // Calculate separate totals for outsource and product costs
  const outsourceCost = order.items.reduce((sum, item) => {
    if (item.isOutsource && item.costPrice) {
      return sum + (item.costPrice * item.quantity);
    }
    return sum;
  }, 0);

  const productCost = order.items.reduce((sum, item) => {
    if (!item.isLabour && !item.isOutsource) {
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      if (productId && productCostMap.has(productId)) {
        return sum + ((productCostMap.get(productId) || 0) * item.quantity);
      }
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Print Controls - Hidden when printing */}
      <div className="max-w-3xl mx-auto mb-4 px-4 print:hidden">
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
              Download
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

      {/* Invoice */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-gray-300 mt-1">#{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{storeName}</p>
              <p className="text-sm text-gray-300">Admin Report</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
              <p className="text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              <p className="text-gray-900">
                {order.customer
                  ? `${order.customer.firstName} ${order.customer.lastName}`
                  : 'Walk-in Customer'
                }
              </p>
              {order.customer?.email && (
                <p className="text-sm text-gray-500">{order.customer.email}</p>
              )}
              {order.customer?.phone && (
                <p className="text-sm text-gray-500">{order.customer.phone}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
              <p className="text-gray-900 capitalize">{order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : order.paymentMethod}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                order.orderStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : order.orderStatus === 'refunded'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {order.orderStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Item</th>
                {hasProductCosts && (
                  <th className="text-center py-2 text-sm font-medium text-gray-500">Type</th>
                )}
                <th className="text-center py-2 text-sm font-medium text-gray-500">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Price</th>
                {hasProductCosts && (
                  <th className="text-right py-2 text-sm font-medium text-orange-600">Cost</th>
                )}
                <th className="text-right py-2 text-sm font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => {
                const costInfo = getItemCostInfo(item);
                return (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">
                        {item.isLabour
                          ? item.labourDescription || 'Custom'
                          : item.isOutsource
                          ? item.outsourceDescription || 'Custom Item'
                          : typeof item.product === 'object' ? item.product?.name : 'Product'}
                      </div>
                      {(item.color || item.size) && (
                        <div className="text-sm text-gray-500">
                          {[item.color, item.size].filter(Boolean).join(' / ')}
                        </div>
                      )}
                      {item.sku && !item.isLabour && !item.isOutsource && (
                        <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                      )}
                    </td>
                    {hasProductCosts && (
                      <td className="py-3 text-center">
                        {costInfo ? (
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            costInfo.type === 'outsource'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {costInfo.type === 'outsource' ? 'Outsource' : 'Product'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-900">{symbol}{item.price.toFixed(2)}</td>
                    {hasProductCosts && (
                      <td className="py-3 text-right text-orange-600">
                        {costInfo ? `${symbol}${costInfo.cost.toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="py-3 text-right text-gray-900">
                      {symbol}{(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{symbol}{order.subtotal.toFixed(2)}</span>
            </div>
            {/* Tax Display - Show breakdown if multiple taxes applied */}
            {order.appliedTaxes && order.appliedTaxes.length > 0 ? (
              <>
                {order.appliedTaxes.length === 1 ? (
                  // Single tax - show name and rate
                  <div className="flex justify-between text-gray-600">
                    <span>{order.appliedTaxes[0].name} ({order.appliedTaxes[0].rate}%)</span>
                    <span>{symbol}{order.appliedTaxes[0].amount.toFixed(2)}</span>
                  </div>
                ) : (
                  // Multiple taxes - show each
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes</span>
                      <span>{symbol}{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="pl-4 space-y-1 border-l-2 border-gray-200 ml-2">
                      {order.appliedTaxes.map((appliedTax, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-500">
                          <span>{appliedTax.name} ({appliedTax.rate}%)</span>
                          <span>{symbol}{appliedTax.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              // Fallback for legacy orders without appliedTaxes
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{symbol}{order.tax.toFixed(2)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{symbol}{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{symbol}{order.total.toFixed(2)}</span>
            </div>
            {/* Cost Summary for Admin */}
            {hasProductCosts && (
              <div className="pt-2 border-t border-orange-200 space-y-1">
                {outsourceCost > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span className="text-sm">Outsource Cost</span>
                    <span>{symbol}{outsourceCost.toFixed(2)}</span>
                  </div>
                )}
                {productCost > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span className="text-sm">Product Cost</span>
                    <span>{symbol}{productCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-orange-600 font-medium">
                  <span>Total Cost</span>
                  <span className="font-bold">{symbol}{totalCostPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            {order.paymentMethod === 'cash' && order.cashAmount && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Received</span>
                  <span>{symbol}{order.cashAmount.toFixed(2)}</span>
                </div>
                {order.changeGiven !== undefined && (
                  <div className="flex justify-between text-gray-600">
                    <span>Change</span>
                    <span>{symbol}{order.changeGiven.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            {/* Payment Status for Partial Payments */}
            {(order.paymentStatus === 'partial' || order.paymentStatus === 'pending') && (
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-700 font-medium">
                    {order.paymentStatus === 'partial' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    Payment Status
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    order.paymentStatus === 'partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {order.paymentStatus === 'partial' ? 'PARTIALLY PAID' : 'PENDING'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid:</span>
                    <span className="text-green-600 font-medium">{symbol}{(order.paidAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending:</span>
                    <span className="text-red-600 font-medium">{symbol}{(order.pendingAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${((order.paidAmount || 0) / order.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {(((order.paidAmount || 0) / order.total) * 100).toFixed(0)}% paid
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        {order.paymentHistory && order.paymentHistory.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Payment History
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {order.paymentHistory.map((payment, idx) => (
                  <div key={payment._id || idx} className="relative flex gap-4 pl-8">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      idx === 0 ? 'bg-blue-500' : 'bg-green-500'
                    } text-white text-xs font-bold`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              idx === 0 ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {idx === 0 ? '1st Payment (Initial)' : `${getOrdinalSuffix(idx + 1)} Payment`}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500 bg-white px-2 py-0.5 rounded border">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatPaymentDate(payment.paidAt)}
                          </div>
                          {payment.receivedBy && (
                            <div className="text-xs text-gray-400 mt-1">
                              Received by: {payment.receivedBy.firstName} {payment.receivedBy.lastName}
                            </div>
                          )}
                          {payment.note && (
                            <div className="text-sm text-gray-500 mt-2 italic bg-white px-2 py-1 rounded border-l-2 border-gray-300">
                              "{payment.note}"
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {symbol}{payment.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show remaining if partial */}
                {order.paymentStatus === 'partial' && order.pendingAmount && order.pendingAmount > 0 && (
                  <div className="relative flex gap-4 pl-8">
                    <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center bg-orange-500 text-white text-xs font-bold animate-pulse">
                      ?
                    </div>
                    <div className="flex-1 bg-orange-50 rounded-lg p-3 border border-orange-200 border-dashed">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-700 font-medium">
                          Next Payment Pending
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                          {symbol}{order.pendingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 text-center text-sm text-gray-500 border-t">
          <p>Thank you for your purchase!</p>
          {order.cashier && (
            <p className="mt-1">
              Served by: {order.cashier.firstName} {order.cashier.lastName}
            </p>
          )}
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
