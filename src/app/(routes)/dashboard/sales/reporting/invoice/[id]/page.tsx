// Admin Reporting Invoice Page
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SalesOrder } from '../../../types';
import { fetchSalesOrders, getStoreSettings } from '../../../services/salesService';
import { downloadSingleInvoicePdf } from '../../../utils/invoicePdfGenerator';
import { Printer, ArrowLeft, Download } from 'lucide-react';
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
    router.push('/dashboard/sales/reporting');
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

  // Get cost for a single item
  const getItemCost = (item: typeof order.items[0]): number | null => {
    if (item.isOutsource && item.costPrice) {
      return item.costPrice;
    }
    const productId = typeof item.product === 'object' ? item.product?._id : item.product;
    if (productId && productCostMap.has(productId)) {
      return productCostMap.get(productId) || 0;
    }
    return null;
  };

  const totalCostPrice = getOrderCostPrice();
  const hasProductCosts = totalCostPrice > 0;

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
                <th className="text-center py-2 text-sm font-medium text-gray-500">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Price</th>
                {hasProductCosts && (
                  <th className="text-right py-2 text-sm font-medium text-orange-600">Cost</th>
                )}
                <th className="text-right py-2 text-sm font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
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
                  <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-900">{symbol}{item.price.toFixed(2)}</td>
                  {hasProductCosts && (
                    <td className="py-3 text-right text-orange-600">
                      {getItemCost(item) !== null ? `${symbol}${getItemCost(item)!.toFixed(2)}` : '-'}
                    </td>
                  )}
                  <td className="py-3 text-right text-gray-900">
                    {symbol}{(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
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
              <div className="flex justify-between text-orange-600 pt-2 border-t border-orange-200">
                <span className="font-medium">Total Cost</span>
                <span className="font-bold">{symbol}{totalCostPrice.toFixed(2)}</span>
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
          </div>
        </div>

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
