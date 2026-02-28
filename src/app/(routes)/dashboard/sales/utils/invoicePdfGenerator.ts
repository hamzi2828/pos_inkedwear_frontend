// Invoice PDF Generator Utility
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesOrder } from '../types';

interface GeneratePdfOptions {
  storeName?: string;
  currency?: string;
  currencySymbol?: string;
  totalExpenses?: number;
  totalProductCost?: number;
  productCostMap?: Map<string, number>;
  pendingAmount?: number;
  pendingOrders?: number;
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: 'Rs ',
    INR: '₹',
  };
  return symbols[currency] || 'Rs ';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    split: 'Split Payment',
    bank_transfer: 'Bank Transfer',
  };
  return methods[method] || method;
};

export const generateInvoicePdf = (
  order: SalesOrder,
  options: GeneratePdfOptions = {}
): jsPDF => {
  const {
    storeName = 'Inked Wear',
    currency = 'PKR',
  } = options;

  const symbol = getCurrencySymbol(currency);
  const doc = new jsPDF();

  // Header background
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, 0, 210, 40, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, 22);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219); // gray-300
  doc.text(`#${order.orderNumber}`, 14, 32);

  // Store name on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName, 196, 22, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);
  doc.text('Point of Sale', 196, 30, { align: 'right' });

  // Order Info Section
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let yPos = 55;

  // Date
  doc.text('Date', 14, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(order.createdAt), 14, yPos + 6);

  // Customer
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer', 105, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : 'Walk-in Customer';
  doc.text(customerName, 105, yPos + 6);
  if (order.customer?.email) {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(order.customer.email, 105, yPos + 12);
  }
  if (order.customer?.phone) {
    doc.text(order.customer.phone, 105, yPos + 17);
  }

  yPos = 80;

  // Payment Method
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method', 14, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(formatPaymentMethod(order.paymentMethod), 14, yPos + 6);

  // Status
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text('Status', 105, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(order.orderStatus.toUpperCase(), 105, yPos + 6);

  // Divider line
  yPos = 100;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, yPos, 196, yPos);

  // Items Table Header
  yPos = 110;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Order Items', 14, yPos);

  // Items Table
  const tableData = order.items.map((item) => {
    // Get product name with multiple fallbacks
    const productName = item.isLabour
      ? (item.labourDescription || 'Custom')
      : item.isOutsource
      ? (item.outsourceDescription || 'Custom Item')
      : (item.productName || (typeof item.product === 'object' ? item.product?.name : null) || item.sku || 'Item');
    const variant = [item.color, item.size].filter(Boolean).join(' / ');
    const itemTotal = item.price * item.quantity - (item.discount || 0);
    const isCustomItem = item.isLabour || item.isOutsource;

    return [
      { content: productName + (variant ? `\n${variant}` : '') + (item.sku && !isCustomItem ? `\nSKU: ${item.sku}` : '') },
      { content: item.quantity.toString(), styles: { halign: 'center' as const } },
      { content: `${symbol}${item.price.toFixed(2)}`, styles: { halign: 'right' as const } },
      { content: `${symbol}${itemTotal.toFixed(2)}`, styles: { halign: 'right' as const } },
    ];
  });

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [17, 24, 39],
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get the Y position after the table
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;

  // Totals Section with background
  const totalsStartY = finalY + 10;
  doc.setFillColor(249, 250, 251); // gray-50
  doc.rect(14, totalsStartY, 182, order.discount > 0 ? 55 : 45, 'F');

  let totalsY = totalsStartY + 12;

  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', 20, totalsY);
  doc.text(`${symbol}${order.subtotal.toFixed(2)}`, 190, totalsY, { align: 'right' });

  totalsY += 8;

  // Tax
  doc.text('Tax', 20, totalsY);
  doc.text(`${symbol}${order.tax.toFixed(2)}`, 190, totalsY, { align: 'right' });

  // Discount
  if (order.discount > 0) {
    totalsY += 8;
    doc.setTextColor(34, 197, 94); // green-500
    doc.text('Discount', 20, totalsY);
    doc.text(`-${symbol}${order.discount.toFixed(2)}`, 190, totalsY, { align: 'right' });
  }

  // Divider
  totalsY += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, totalsY, 190, totalsY);

  // Total
  totalsY += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Total', 20, totalsY);
  doc.text(`${symbol}${order.total.toFixed(2)}`, 190, totalsY, { align: 'right' });

  // Cash payment details
  if (order.paymentMethod === 'cash' && order.cashAmount) {
    totalsY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Cash Received', 20, totalsY);
    doc.text(`${symbol}${order.cashAmount.toFixed(2)}`, 190, totalsY, { align: 'right' });

    if (order.changeGiven !== undefined) {
      totalsY += 8;
      doc.text('Change', 20, totalsY);
      doc.text(`${symbol}${order.changeGiven.toFixed(2)}`, 190, totalsY, { align: 'right' });
    }
  }

  // Footer
  const footerY = Math.min(totalsY + 25, 270);
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your purchase!', 105, footerY + 10, { align: 'center' });

  if (order.cashier) {
    doc.text(
      `Served by: ${order.cashier.firstName} ${order.cashier.lastName}`,
      105,
      footerY + 18,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadSingleInvoicePdf = (
  order: SalesOrder,
  options: GeneratePdfOptions = {}
): void => {
  const doc = generateInvoicePdf(order, options);
  doc.save(`Invoice-${order.orderNumber}.pdf`);
};

const generateSummaryPage = (
  doc: jsPDF,
  orders: SalesOrder[],
  options: GeneratePdfOptions = {}
): void => {
  const {
    storeName = 'Inked Wear',
    currency = 'PKR',
    totalExpenses = 0,
    totalProductCost,
    productCostMap,
    pendingAmount = 0,
    pendingOrders = 0,
  } = options;

  const symbol = getCurrencySymbol(currency);

  // Calculate totals
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
  const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
  const bankTotal = orders.filter(o => o.paymentMethod === 'bank_transfer').reduce((sum, o) => sum + o.total, 0);

  // Calculate product cost using productCostMap if available, otherwise use outsource cost only
  const getOrderCostPrice = (order: SalesOrder): number => {
    return order.items.reduce((sum, item) => {
      // For outsource items, use the saved costPrice
      if (item.isOutsource && item.costPrice) {
        return sum + (item.costPrice * item.quantity);
      }
      // For regular products, look up costPrice from productCostMap
      if (productCostMap) {
        const productId = typeof item.product === 'object' ? item.product?._id : item.product;
        if (productId && productCostMap.has(productId)) {
          const costPrice = productCostMap.get(productId) || 0;
          return sum + (costPrice * item.quantity);
        }
      }
      return sum;
    }, 0);
  };

  // Use provided totalProductCost if available, otherwise calculate
  const totalCostPrice = totalProductCost !== undefined
    ? totalProductCost
    : orders.reduce((sum, order) => sum + getOrderCostPrice(order), 0);

  // Calculate profit: Sales - Expenses - Product Cost
  const netProfit = totalSales - totalExpenses - totalCostPrice;

  // Get date range
  const dates = orders.map(o => new Date(o.createdAt).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const dateRangeStr = minDate.toDateString() === maxDate.toDateString()
    ? minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES SUMMARY', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);
  doc.text(dateRangeStr, 14, 24);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName, 196, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 24, { align: 'right' });

  let yPos = 38;

  // Overview Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Overview', 14, yPos);
  yPos += 6;

  // Overview boxes
  const boxWidth = 44;
  const boxHeight = 22;
  const boxGap = 4;
  const boxStartX = 14;

  // Box 1: Total Orders
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(boxStartX, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.setFont('helvetica', 'normal');
  doc.text('Total Orders', boxStartX + 3, yPos + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(totalOrders.toString(), boxStartX + 3, yPos + 17);

  // Box 2: Total Sales
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(boxStartX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74); // green-600
  doc.setFont('helvetica', 'normal');
  doc.text('Total Sales', boxStartX + boxWidth + boxGap + 3, yPos + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45); // green-900
  doc.text(`${symbol}${totalSales.toFixed(2)}`, boxStartX + boxWidth + boxGap + 3, yPos + 17);

  // Box 3: Average Order
  doc.setFillColor(250, 245, 255); // purple-50
  doc.roundedRect(boxStartX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(147, 51, 234); // purple-600
  doc.setFont('helvetica', 'normal');
  doc.text('Average Order', boxStartX + (boxWidth + boxGap) * 2 + 3, yPos + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(88, 28, 135); // purple-900
  doc.text(`${symbol}${averageOrder.toFixed(2)}`, boxStartX + (boxWidth + boxGap) * 2 + 3, yPos + 17);

  yPos += boxHeight + 8;

  // Financial Summary Section - Compact 5 columns
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(14, yPos, 182, 24, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Financial Summary', 18, yPos + 7);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`(${dateRangeStr})`, 65, yPos + 7);

  const finBoxWidth = 36;
  const finBoxY = yPos + 10;

  // Total Sales
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Sales', 18, finBoxY + 4);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${symbol}${totalSales.toFixed(0)}`, 18, finBoxY + 9);

  // Expenses
  doc.setFontSize(6);
  doc.setTextColor(220, 38, 38); // red-600
  doc.setFont('helvetica', 'normal');
  doc.text('Expenses', 18 + finBoxWidth, finBoxY + 4);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`${symbol}${totalExpenses.toFixed(0)}`, 18 + finBoxWidth, finBoxY + 9);

  // Product Cost
  doc.setFontSize(6);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.setFont('helvetica', 'normal');
  doc.text('Cost', 18 + finBoxWidth * 2, finBoxY + 4);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(`${symbol}${totalCostPrice.toFixed(0)}`, 18 + finBoxWidth * 2, finBoxY + 9);

  // Profit
  doc.setFontSize(6);
  doc.setTextColor(netProfit >= 0 ? 22 : 220, netProfit >= 0 ? 163 : 38, netProfit >= 0 ? 74 : 38);
  doc.setFont('helvetica', 'normal');
  doc.text('Profit', 18 + finBoxWidth * 3, finBoxY + 4);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netProfit >= 0 ? 22 : 220, netProfit >= 0 ? 163 : 38, netProfit >= 0 ? 74 : 38);
  doc.text(`${symbol}${netProfit.toFixed(0)}`, 18 + finBoxWidth * 3, finBoxY + 9);

  // Pending
  doc.setFontSize(6);
  doc.setTextColor(pendingOrders > 0 ? 220 : 22, pendingOrders > 0 ? 38 : 163, pendingOrders > 0 ? 38 : 74);
  doc.setFont('helvetica', 'normal');
  doc.text('Pending', 18 + finBoxWidth * 4, finBoxY + 4);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol}${pendingAmount.toFixed(0)}`, 18 + finBoxWidth * 4, finBoxY + 9);

  yPos += 28;

  // Orders Section Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`Orders (${orders.length})`, 14, yPos);
  yPos += 4;

  // Invoice List Table with total row at the end - Always show cost column
  const tableData = orders.map((order, index) => {
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : 'Walk-in';
    const orderCost = getOrderCostPrice(order);
    const orderDate = new Date(order.createdAt);
    const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Build status string with paid/due on separate lines
    let statusStr = order.paymentStatus === 'completed' ? 'PAID' :
                    order.paymentStatus === 'partial' ? 'PARTIAL' :
                    order.paymentStatus === 'pending' ? 'PENDING' :
                    order.paymentStatus === 'refunded' ? 'REFUNDED' : 'PAID';

    if (order.paymentStatus === 'partial' || order.paymentStatus === 'pending') {
      if (order.paidAmount !== undefined) {
        statusStr += `\nPaid: ${symbol}${order.paidAmount.toFixed(0)}`;
      }
      if (order.pendingAmount) {
        statusStr += `\nDue: ${symbol}${order.pendingAmount.toFixed(0)}`;
      }
    }

    return [
      (index + 1).toString(),
      order.orderNumber,
      `${dateStr}\n${timeStr}`,
      customerName,
      formatPaymentMethod(order.paymentMethod),
      statusStr,
      orderCost > 0 ? `${symbol}${orderCost.toFixed(0)}` : '-',
      `${symbol}${order.total.toFixed(0)}`,
    ];
  });

  // Build breakdown string (e.g., "Cash: Rs 92,900 + Card: Rs 34,500")
  const breakdownParts: string[] = [];
  if (cashTotal > 0) {
    breakdownParts.push(`Cash: ${symbol}${cashTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  }
  if (cardTotal > 0) {
    breakdownParts.push(`Card: ${symbol}${cardTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  }
  if (bankTotal > 0) {
    breakdownParts.push(`Bank: ${symbol}${bankTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  }
  const breakdownStr = breakdownParts.join(' + ');

  // Add breakdown row
  const breakdownRowIndex = orders.length;
  const breakdownRow = ['', '', '', '', '', '', '', breakdownStr];
  tableData.push(breakdownRow);

  // Add total row
  const totalRowIndex = orders.length + 1;
  const totalRow = [
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    `${symbol}${totalCostPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    `${symbol}${totalSales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  ];
  tableData.push(totalRow);

  // Build table headers - Include Status and Cost columns before Total
  const tableHeaders = ['#', 'Invoice', 'Date/Time', 'Customer', 'Payment', 'Status', 'Cost', 'Total'];

  // Build column styles
  const colStyles: Record<number, any> = {
    0: { cellWidth: 8, halign: 'center' },
    1: { cellWidth: 22 },
    2: { cellWidth: 22 },
    3: { cellWidth: 28 },
    4: { cellWidth: 20 },
    5: { cellWidth: 26 }, // Status column
    6: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] }, // orange-600 for Cost
    7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
  };

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: [17, 24, 39],
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: colStyles,
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Style the breakdown row (gray background)
      if (data.row.index === breakdownRowIndex && data.section === 'body') {
        doc.setFillColor(243, 244, 246);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        if (data.column.index === 7 && breakdownStr) {
          doc.setTextColor(75, 85, 99);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(breakdownStr, data.cell.x + data.cell.width - 2, data.cell.y + data.cell.height - 3, { align: 'right' });
        }
      }
      // Style the total row (dark background)
      if (data.row.index === totalRowIndex && data.section === 'body') {
        doc.setFillColor(17, 24, 39);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        if (data.column.index === 5) {
          doc.text('TOTAL', data.cell.x + 2, data.cell.y + data.cell.height - 3);
        } else if (data.column.index === 6) {
          // Cost column - orange color
          doc.setTextColor(251, 146, 60); // orange-400 for visibility on dark bg
          doc.text(
            `${symbol}${totalCostPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            data.cell.x + data.cell.width - 2,
            data.cell.y + data.cell.height - 3,
            { align: 'right' }
          );
        } else if (data.column.index === 7) {
          // Total column
          doc.setTextColor(255, 255, 255);
          doc.text(
            `${symbol}${totalSales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            data.cell.x + data.cell.width - 2,
            data.cell.y + data.cell.height - 3,
            { align: 'right' }
          );
        }
      }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${data.pageNumber}`, 105, 290, { align: 'center' });
    },
  });

  // Payment Breakdown Section - After orders table
  const finalTableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
  let paymentY = finalTableY + 10;

  // Check if we need a new page
  if (paymentY > 260) {
    doc.addPage();
    paymentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Payment Breakdown', 14, paymentY);
  paymentY += 6;

  const payBoxWidth = 60;
  const payBoxHeight = 18;

  // Cash box
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, paymentY, payBoxWidth, payBoxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.text('Cash', 17, paymentY + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${symbol}${cashTotal.toFixed(2)}`, 17, paymentY + 14);

  // Card box
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14 + payBoxWidth + 4, paymentY, payBoxWidth, payBoxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.text('Card', 14 + payBoxWidth + 4 + 3, paymentY + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${symbol}${cardTotal.toFixed(2)}`, 14 + payBoxWidth + 4 + 3, paymentY + 14);

  // Bank Transfer box
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14 + (payBoxWidth + 4) * 2, paymentY, payBoxWidth, payBoxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Transfer', 14 + (payBoxWidth + 4) * 2 + 3, paymentY + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${symbol}${bankTotal.toFixed(2)}`, 14 + (payBoxWidth + 4) * 2 + 3, paymentY + 14);
};

export const downloadSalesSummaryPdf = (
  orders: SalesOrder[],
  options: GeneratePdfOptions = {}
): void => {
  if (orders.length === 0) return;

  const doc = new jsPDF();
  generateSummaryPage(doc, orders, options);

  const date = new Date().toISOString().split('T')[0];
  doc.save(`sales-summary-${date}.pdf`);
};

export const downloadBulkInvoicesPdf = async (
  orders: SalesOrder[],
  options: GeneratePdfOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  if (orders.length === 0) return;

  if (orders.length === 1) {
    downloadSingleInvoicePdf(orders[0], options);
    return;
  }

  // Create a single PDF document
  const doc = new jsPDF();

  // Generate summary page(s) first
  generateSummaryPage(doc, orders, options);

  if (onProgress) {
    onProgress(0, orders.length);
  }

  // Add each invoice as a new page
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    // Add new page for each invoice
    doc.addPage();

    // Generate the invoice content directly on the current page
    generateInvoiceOnPage(doc, order, options, i + 1, orders.length);

    if (onProgress) {
      onProgress(i + 1, orders.length);
    }
  }

  // Save the combined PDF
  const date = new Date().toISOString().split('T')[0];
  doc.save(`invoices-report-${date}.pdf`);
};

// Helper function to generate invoice directly on a page of an existing document
const generateInvoiceOnPage = (
  doc: jsPDF,
  order: SalesOrder,
  options: GeneratePdfOptions = {},
  pageNum: number,
  totalPages: number
): void => {
  const {
    storeName = 'Inked Wear',
    currency = 'PKR',
  } = options;

  const symbol = getCurrencySymbol(currency);

  // Header background
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 40, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, 22);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);
  doc.text(`#${order.orderNumber}`, 14, 32);

  // Store name on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName, 196, 22, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);
  doc.text('Point of Sale', 196, 30, { align: 'right' });

  // Order Info Section
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let yPos = 55;

  // Date
  doc.text('Date', 14, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(order.createdAt), 14, yPos + 6);

  // Customer
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer', 105, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : 'Walk-in Customer';
  doc.text(customerName, 105, yPos + 6);
  if (order.customer?.email) {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(order.customer.email, 105, yPos + 12);
  }
  if (order.customer?.phone) {
    doc.text(order.customer.phone, 105, yPos + 17);
  }

  yPos = 80;

  // Payment Method
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method', 14, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(formatPaymentMethod(order.paymentMethod), 14, yPos + 6);

  // Status
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text('Status', 105, yPos);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(order.orderStatus.toUpperCase(), 105, yPos + 6);

  // Divider line
  yPos = 100;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, yPos, 196, yPos);

  // Items Table Header
  yPos = 110;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Order Items', 14, yPos);

  // Items Table
  const tableData = order.items.map((item) => {
    // Get product name with multiple fallbacks
    const productName = item.isLabour
      ? (item.labourDescription || 'Custom')
      : item.isOutsource
      ? (item.outsourceDescription || 'Custom Item')
      : (item.productName || (typeof item.product === 'object' ? item.product?.name : null) || item.sku || 'Item');
    const variant = [item.color, item.size].filter(Boolean).join(' / ');
    const itemTotal = item.price * item.quantity - (item.discount || 0);
    const isCustomItem = item.isLabour || item.isOutsource;

    return [
      { content: productName + (variant ? `\n${variant}` : '') + (item.sku && !isCustomItem ? `\nSKU: ${item.sku}` : '') },
      { content: item.quantity.toString(), styles: { halign: 'center' as const } },
      { content: `${symbol}${item.price.toFixed(2)}`, styles: { halign: 'right' as const } },
      { content: `${symbol}${itemTotal.toFixed(2)}`, styles: { halign: 'right' as const } },
    ];
  });

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [17, 24, 39],
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get the Y position after the table
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;

  // Totals Section
  const totalsStartY = finalY + 10;
  doc.setFillColor(249, 250, 251);
  doc.rect(14, totalsStartY, 182, order.discount > 0 ? 55 : 45, 'F');

  let totalsY = totalsStartY + 12;

  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', 20, totalsY);
  doc.text(`${symbol}${order.subtotal.toFixed(2)}`, 190, totalsY, { align: 'right' });

  totalsY += 8;

  // Tax
  doc.text('Tax', 20, totalsY);
  doc.text(`${symbol}${order.tax.toFixed(2)}`, 190, totalsY, { align: 'right' });

  // Discount
  if (order.discount > 0) {
    totalsY += 8;
    doc.setTextColor(34, 197, 94);
    doc.text('Discount', 20, totalsY);
    doc.text(`-${symbol}${order.discount.toFixed(2)}`, 190, totalsY, { align: 'right' });
  }

  // Divider
  totalsY += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, totalsY, 190, totalsY);

  // Total
  totalsY += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Total', 20, totalsY);
  doc.text(`${symbol}${order.total.toFixed(2)}`, 190, totalsY, { align: 'right' });

  // Cash payment details
  if (order.paymentMethod === 'cash' && order.cashAmount) {
    totalsY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Cash Received', 20, totalsY);
    doc.text(`${symbol}${order.cashAmount.toFixed(2)}`, 190, totalsY, { align: 'right' });

    if (order.changeGiven !== undefined) {
      totalsY += 8;
      doc.text('Change', 20, totalsY);
      doc.text(`${symbol}${order.changeGiven.toFixed(2)}`, 190, totalsY, { align: 'right' });
    }
  }

  // Footer
  const footerY = Math.min(totalsY + 25, 270);
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your purchase!', 105, footerY + 10, { align: 'center' });

  if (order.cashier) {
    doc.text(
      `Served by: ${order.cashier.firstName} ${order.cashier.lastName}`,
      105,
      footerY + 18,
      { align: 'center' }
    );
  }

  // Page number footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Invoice ${pageNum} of ${totalPages}`,
    105,
    290,
    { align: 'center' }
  );
};
