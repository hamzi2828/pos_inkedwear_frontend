// Receipt Printer Utility
import { SalesOrder } from '../types';
import { getCurrencySymbol } from '@/helper/helper';

/**
 * Print a thermal receipt for an order
 */
export function printThermalReceipt(order: SalesOrder, storeName: string = 'POS STORE', currency: string = 'PKR') {
  const symbol = getCurrencySymbol(currency);
  const receiptDate = new Date(order.createdAt);
  const formattedDate = receiptDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = receiptDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodLabel = order.paymentMethod === 'bank_transfer'
    ? 'Bank Transfer'
    : order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1);

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${order.orderNumber}</title>
      <style>
        @page { size: 72mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 72mm; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 72mm; padding: 3mm; background: white; }
        .header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
        .store-name { font-size: 14px; font-weight: bold; }
        .order-info { margin: 8px 0; border-bottom: 1px dashed #000; padding-bottom: 8px; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .items { margin: 8px 0; border-bottom: 1px dashed #000; padding-bottom: 8px; }
        .item { margin: 4px 0; }
        .item-name { font-weight: bold; }
        .item-details { display: flex; justify-content: space-between; padding-left: 8px; }
        .totals { margin: 8px 0; }
        .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .grand-total { font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        .payment-info { margin: 8px 0; border-top: 1px dashed #000; padding-top: 8px; }
        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
        @media print { html, body { width: 72mm; } @page { size: 72mm auto; margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div style="font-size: 10px; margin-top: 4px;">${order.orderNumber}</div>
        <div>Thank you for your purchase!</div>
      </div>
      <div class="order-info">
        <div class="row"><span>Order #:</span><span>${order.orderNumber}</span></div>
        <div class="row"><span>Date:</span><span>${formattedDate}</span></div>
        <div class="row"><span>Time:</span><span>${formattedTime}</span></div>
        ${order.customer ? `<div class="row"><span>Customer:</span><span>${order.customer.firstName} ${order.customer.lastName}</span></div>` : ''}
        ${order.cashier ? `<div class="row"><span>Cashier:</span><span>${order.cashier.firstName}</span></div>` : ''}
      </div>
      <div class="items">
        ${order.items.map(item => {
          const productName = item.isLabour
            ? (item.labourDescription || 'Custom')
            : item.isOutsource
            ? (item.outsourceDescription || 'Custom Item')
            : (typeof item.product === 'object' ? item.product.name : 'Product');
          return `
          <div class="item">
            <div class="item-name">${productName}</div>
            ${item.size || item.color ? `<div style="font-size: 10px; color: #666;">${item.size || ''} ${item.color || ''}</div>` : ''}
            <div class="item-details">
              <span>${item.quantity} x ${symbol}${item.price.toFixed(2)}</span>
              <span>${symbol}${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      <div class="totals">
        <div class="total-row"><span>Subtotal:</span><span>${symbol}${order.subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Tax:</span><span>${symbol}${order.tax.toFixed(2)}</span></div>
        ${order.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${symbol}${order.discount.toFixed(2)}</span></div>` : ''}
        <div class="total-row grand-total"><span>TOTAL:</span><span>${symbol}${order.total.toFixed(2)}</span></div>
      </div>
      <div class="payment-info">
        <div class="row"><span>Payment:</span><span>${paymentMethodLabel}</span></div>
        ${order.cashAmount ? `<div class="row"><span>Cash:</span><span>${symbol}${order.cashAmount.toFixed(2)}</span></div>` : ''}
        ${order.changeGiven ? `<div class="row"><span>Change:</span><span>${symbol}${order.changeGiven.toFixed(2)}</span></div>` : ''}
      </div>
      <div class="footer">
        <div>Thank you!</div>
        <div>Please come again</div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
          setTimeout(function() { window.close(); }, 1000);
        }
      </script>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '80mm';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(receiptHTML);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }
}
