// Cost Analysis Page - Track product costs and profits
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Download } from 'lucide-react';
import { SalesOrder, DateFilterType } from '../../sales/types';
import { fetchSalesOrders, getStoreSettings } from '../../sales/services/salesService';
import { productService, ProductUI } from '../../products/services/productService';
import { vendorService } from '../../vendors/service/vendorService';
import SalesFilters from '../../sales/components/SalesFilters';
import jsPDF from 'jspdf';

interface Vendor {
  _id: string;
  name: string;
}

interface CostItem {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  description: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  totalCost: number;
  profit: number;
  isOutsource: boolean;
  vendorId?: string;
}

export default function CostAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL params
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get('dateFilter') as DateFilterType) || 'all'
  );
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');
  const [paymentFilter, setPaymentFilter] = useState<string>(searchParams.get('payment') || 'all');
  const [vendorFilter, setVendorFilter] = useState<string>(searchParams.get('vendor') || 'all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currency, setCurrency] = useState<string>('PKR');
  const [storeName, setStoreName] = useState<string>('Store');
  const [productCostMap, setProductCostMap] = useState<Map<string, { costPrice: number; name: string; vendor?: string }>>(new Map());
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Load settings, products and vendors (only once on mount)
  useEffect(() => {
    const loadSettingsAndProducts = async () => {
      try {
        const [settings, allProducts, allVendors] = await Promise.all([
          getStoreSettings(),
          productService.listProducts(),
          vendorService.getVendors()
        ]);

        if (settings?.currency) {
          setCurrency(settings.currency);
        }
        if (settings?.storeName) {
          setStoreName(settings.storeName);
        }

        // Set vendors for filter dropdown
        setVendors(allVendors.map((v: any) => ({ _id: v._id, name: v.name })));

        // Build product cost map with name and vendor
        const costMap = new Map<string, { costPrice: number; name: string; vendor?: string }>();
        allProducts.forEach((product: ProductUI) => {
          if (product.id && product.costPrice) {
            costMap.set(product.id, {
              costPrice: product.costPrice,
              name: product.name,
              vendor: product.vendor
            });
          }
        });
        setProductCostMap(costMap);
        setProductsLoaded(true);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProductsLoaded(true);
      }
    };
    loadSettingsAndProducts();
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (dateFilter && dateFilter !== 'all') {
      params.set('dateFilter', dateFilter);
    }
    if (customStartDate) {
      params.set('startDate', customStartDate);
    }
    if (customEndDate) {
      params.set('endDate', customEndDate);
    }
    if (paymentFilter && paymentFilter !== 'all') {
      params.set('payment', paymentFilter);
    }
    if (vendorFilter && vendorFilter !== 'all') {
      params.set('vendor', vendorFilter);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/dashboard/reporting/cost-analysis?${queryString}`
      : '/dashboard/reporting/cost-analysis';

    router.replace(newUrl, { scroll: false });
  }, [dateFilter, customStartDate, customEndDate, paymentFilter, vendorFilter, searchQuery, router]);

  // Fetch orders
  const loadOrders = useCallback(async () => {
    // Skip fetching if custom filter is selected but dates are incomplete
    if (dateFilter === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    try {
      setLoading(true);

      const now = new Date();
      let params: { date?: string; startDate?: string; endDate?: string; limit: number } = {
        limit: 500,
      };

      if (dateFilter === 'today') {
        params.date = now.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const { orders: fetchedOrders } = await fetchSalesOrders(params);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch orders when filters change
  useEffect(() => {
    if (productsLoaded) {
      loadOrders();
    }
  }, [loadOrders, productsLoaded]);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'Rs ';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return curr + ' ';
    }
  };

  // Extract all items with cost prices from orders
  const getAllCostItems = (): CostItem[] => {
    const items: CostItem[] = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        // Handle outsource items
        if (item.isOutsource && item.costPrice) {
          items.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            description: item.outsourceDescription || 'Custom Item',
            quantity: item.quantity,
            costPrice: item.costPrice,
            sellingPrice: item.price,
            totalCost: item.costPrice * item.quantity,
            profit: (item.price - item.costPrice) * item.quantity,
            isOutsource: true,
          });
        }
        // Handle regular products with cost prices
        else if (!item.isLabour && !item.isOutsource) {
          const productId = typeof item.product === 'object' ? item.product?._id : item.product;
          if (productId && productCostMap.has(productId)) {
            const productInfo = productCostMap.get(productId)!;
            const productName = productInfo.name || (typeof item.product === 'object' ? item.product?.name : null) || 'Product';

            items.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              orderDate: order.createdAt,
              description: productName,
              quantity: item.quantity,
              costPrice: productInfo.costPrice,
              sellingPrice: item.price,
              totalCost: productInfo.costPrice * item.quantity,
              profit: (item.price - productInfo.costPrice) * item.quantity,
              isOutsource: false,
              vendorId: productInfo.vendor,
            });
          }
        }
      });
    });

    // Filter by vendor
    let filteredItems = vendorFilter && vendorFilter !== 'all'
      ? items.filter(item => item.vendorId === vendorFilter)
      : items;

    // Filter by search query
    filteredItems = searchQuery
      ? filteredItems.filter(item =>
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredItems;

    // Sort by date descending
    return filteredItems.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  };

  const costItems = getAllCostItems();
  const totalCost = costItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSale = costItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalProfit = costItems.reduce((sum, item) => sum + item.profit, 0);

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

  // Download PDF report
  const handleDownloadPdf = () => {
    if (costItems.length === 0) return;

    const doc = new jsPDF();
    const symbol = getCurrencySymbol(currency);
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COST ANALYSIS REPORT', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(storeName, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Period: ${getDateRangeLabel()}`, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${costItems.length}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Cost: ${symbol}${totalCost.toFixed(2)}`, 14, yPos);
    doc.text(`Total Sale: ${symbol}${totalSale.toFixed(2)}`, 80, yPos);
    doc.text(`Total Profit: ${symbol}${totalProfit.toFixed(2)}`, 140, yPos);
    yPos += 12;

    // Table header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Order #', 14, yPos);
    doc.text('Date', 45, yPos);
    doc.text('Product', 70, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Cost', 135, yPos);
    doc.text('Selling', 155, yPos);
    doc.text('Total', 175, yPos);
    doc.text('Profit', 192, yPos);
    yPos += 5;

    // Draw line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos - 2, 196, yPos - 2);

    // Items
    doc.setFont('helvetica', 'normal');
    costItems.forEach((item) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }

      const orderNum = item.orderNumber.length > 15 ? item.orderNumber.slice(-15) : item.orderNumber;
      const productDesc = item.description.length > 25 ? item.description.slice(0, 22) + '...' : item.description;

      doc.text(orderNum, 14, yPos);
      doc.text(new Date(item.orderDate).toLocaleDateString(), 45, yPos);
      doc.text(productDesc, 70, yPos);
      doc.text(item.quantity.toString(), 123, yPos);
      doc.text(item.costPrice.toFixed(0), 135, yPos);
      doc.text(item.sellingPrice.toFixed(0), 155, yPos);
      doc.text(item.totalCost.toFixed(0), 175, yPos);
      doc.text(item.profit.toFixed(0), 192, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Grand total
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(50, 50, 50);
    doc.rect(14, yPos, 182, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 16, yPos + 8);
    doc.text(`Cost: ${symbol}${totalCost.toFixed(2)}`, 70, yPos + 8);
    doc.text(`Sale: ${symbol}${totalSale.toFixed(2)}`, 115, yPos + 8);
    doc.text(`Profit: ${symbol}${totalProfit.toFixed(2)}`, 160, yPos + 8);
    doc.setTextColor(0, 0, 0);

    // Save PDF
    const filename = `Cost_Analysis_${getDateRangeLabel().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Track product costs and profits</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={loading || costItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{costItems.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <p className="text-sm text-orange-600">Total Cost</p>
          <p className="text-2xl font-bold text-orange-700">{getCurrencySymbol(currency)}{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600">Total Sale</p>
          <p className="text-2xl font-bold text-blue-700">{getCurrencySymbol(currency)}{totalSale.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">Total Profit</p>
          <p className="text-2xl font-bold text-green-700">{getCurrencySymbol(currency)}{totalProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <SalesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        vendorFilter={vendorFilter}
        onVendorFilterChange={setVendorFilter}
        vendors={vendors}
      />

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">
            Products with Cost ({costItems.length} items) - {getDateRangeLabel()}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-orange-600 uppercase">Total Cost</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 uppercase">Total Sale</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-green-600 uppercase">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(loading || !productsLoaded) ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : costItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <p className="text-gray-500">No products with cost prices found</p>
                    <p className="text-xs text-gray-400 mt-1">Make sure products have cost prices set in the catalog</p>
                  </td>
                </tr>
              ) : (
                costItems.map((item, idx) => (
                  <tr key={`${item.orderId}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{item.orderNumber}</td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {new Date(item.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        item.isOutsource ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.isOutsource ? 'Outsource' : 'Product'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{getCurrencySymbol(currency)}{item.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{getCurrencySymbol(currency)}{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-orange-600 font-medium">
                      {getCurrencySymbol(currency)}{item.totalCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-blue-600 font-medium">
                      {getCurrencySymbol(currency)}{(item.sellingPrice * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-green-600 font-medium">
                      {getCurrencySymbol(currency)}{item.profit.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && costItems.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={7} className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">
                    Total
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-orange-700">
                    {getCurrencySymbol(currency)}{totalCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-blue-700">
                    {getCurrencySymbol(currency)}{totalSale.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-green-700">
                    {getCurrencySymbol(currency)}{totalProfit.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
