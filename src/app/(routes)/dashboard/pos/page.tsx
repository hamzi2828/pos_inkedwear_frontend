// POS Page - Point of Sale System
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { POSProduct, POSCart, CartItem, POSCustomer, POSVariant, PaymentMethodType, POSOrderData, POSOrder, POSTax, AppliedTax, CustomerInfo } from './types';
import { getEmployeeId } from '@/helper/helper';
import { activityLogService } from '@/services/activityLogService';
import ProductSearch from './components/ProductSearch';
import ProductGrid from './components/ProductGrid';
import CartPanel from './components/CartPanel';
import CustomerSelector from './components/CustomerSelector';
import VariantSelector from './components/VariantSelector';
import PaymentModal from './components/PaymentModal';
import HeldOrders from './components/HeldOrders';
import SalesHistory from './components/SalesHistory';
import PendingPaymentsTab from './components/PendingPaymentsTab';
import { getPOSProducts } from './services/posProductService';
import { createPOSOrder, getPOSOrders } from './services/posOrderService';
import { createOrFindCustomer } from './services/posCustomerService';
import { holdCart, getHeldCarts, retrieveHeldCart, clearHeldCart } from './services/posCartService';
import { Archive, Receipt, Filter, AlertCircle } from 'lucide-react';
import { getAuthHeader } from '@/helper/helper';

const DEFAULT_TAX_RATE = 0.08; // 8% fallback tax rate
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type POSTab = 'products' | 'held' | 'history' | 'pending';

const TAB_LABELS: Record<POSTab, string> = {
  products: 'Products',
  held: 'Held Orders',
  history: "Today's Sales",
  pending: 'Pending Payments',
};

export default function POSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial tab from URL or default to 'products'
  const urlTab = searchParams.get('tab') as POSTab | null;
  const initialTab: POSTab = urlTab && ['products', 'held', 'history', 'pending'].includes(urlTab) ? urlTab : 'products';

  // State
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<POSTax[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [cart, setCart] = useState<POSCart>({
    items: [],
    subtotal: 0,
    tax: 0,
    taxRate: DEFAULT_TAX_RATE,
    appliedTaxes: [],
    discount: 0,
    total: 0,
  });
  const [customer, setCustomer] = useState<POSCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [heldCarts, setHeldCarts] = useState(getHeldCarts());
  const [recentOrders, setRecentOrders] = useState<POSOrder[]>([]);
  const [activeTab, setActiveTab] = useState<POSTab>(initialTab);
  const [storeName, setStoreName] = useState<string>('POS STORE');
  const [currency, setCurrency] = useState<string>('PKR');

  // Handle tab change with URL update and activity logging
  const handleTabChange = useCallback((tab: POSTab) => {
    setActiveTab(tab);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/dashboard/pos?${params.toString()}`, { scroll: false });

    // Log activity
    const employeeId = getEmployeeId();
    if (employeeId) {
      activityLogService.logActivity({
        employeeId,
        action: 'page_visit',
        module: 'POS',
        description: `Viewed ${TAB_LABELS[tab]} tab`,
        metadata: { tab, path: `/dashboard/pos?tab=${tab}` }
      });
    }
  }, [router, searchParams]);

  // Modals
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.storeName) {
          setStoreName(data.data.storeName);
        }
        if (data.data?.currency) {
          setCurrency(data.data.currency);
        }
        // Load taxes
        if (data.data?.taxes && Array.isArray(data.data.taxes)) {
          const activeTaxes = data.data.taxes.filter((t: POSTax) => t.isActive);
          setAvailableTaxes(activeTaxes);
          // Auto-select default tax
          const defaultTax = activeTaxes.find((t: POSTax) => t.isDefault);
          if (defaultTax) {
            setSelectedTaxIds([defaultTax.taxId]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPOSProducts(searchQuery);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load recent orders
  const loadRecentOrders = useCallback(async () => {
    try {
      const { orders } = await getPOSOrders(new Date().toISOString().split('T')[0], 20);
      setRecentOrders(orders);
    } catch (error) {
      console.error('Failed to load recent orders:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts();
    loadRecentOrders();
    loadSettings();
  }, [loadProducts, loadRecentOrders, loadSettings]);

  // Memoized cart signature for detecting changes
  const cartSignature = useMemo(() => {
    return cart.items.map(i => `${i.id}:${i.quantity}:${i.subtotal}`).join('|');
  }, [cart.items]);

  // Update cart totals whenever items or taxes change
  useEffect(() => {
    setCart(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.subtotal, 0);

      // Calculate taxes from selected taxes (rate is stored as percentage e.g. 10 for 10%)
      const appliedTaxes: AppliedTax[] = selectedTaxIds
        .map(taxId => {
          const tax = availableTaxes.find(t => t.taxId === taxId);
          if (!tax) return null;
          return {
            taxId: tax.taxId,
            name: tax.name,
            rate: tax.rate,
            amount: subtotal * (tax.rate / 100),
          };
        })
        .filter((t): t is AppliedTax => t !== null);

      const totalTax = appliedTaxes.reduce((sum, t) => sum + t.amount, 0);
      const combinedTaxRate = appliedTaxes.reduce((sum, t) => sum + t.rate, 0);
      const total = subtotal + totalTax - prev.discount;

      return {
        ...prev,
        subtotal,
        tax: totalTax,
        taxRate: combinedTaxRate,
        appliedTaxes,
        total: Math.max(0, total),
      };
    });
  }, [cartSignature, cart.discount, selectedTaxIds, availableTaxes]);

  // Search products (debounced)
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [loadProducts]);

  const handleProductSelect = (product: POSProduct) => {
    if (product.productType === 'variant') {
      setSelectedProduct(product);
      setShowVariantSelector(true);
    } else {
      addToCart(product);
    }
  };

  const handleVariantSelect = (variant: POSVariant) => {
    if (selectedProduct) {
      addToCart(selectedProduct, variant);
    }
  };

  const addToCart = (product: POSProduct, variant?: POSVariant) => {
    const itemId = variant ? `${product._id}-${variant.variantId}` : product._id;
    const existingItem = cart.items.find(item => item.id === itemId);

    if (existingItem) {
      // Update quantity
      updateQuantity(itemId, existingItem.quantity + 1);
    } else {
      // Add new item
      const unitPrice = variant
        ? (variant.discountedPrice || variant.price)
        : (product.discountedPrice || product.price);

      const newItem: CartItem = {
        id: itemId,
        product,
        variantId: variant?.variantId,
        variant,
        quantity: 1,
        unitPrice,
        discount: 0,
        subtotal: unitPrice,
        color: variant?.color,
        size: variant?.size,
      };

      setCart(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, quantity, subtotal: item.unitPrice * quantity - item.discount }
          : item
      ),
    }));
  };

  const removeItem = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const addCustomItemToCart = (description: string, salePrice: number, costPrice?: number) => {
    const customId = `custom-${Date.now()}`;
    const isOutsource = costPrice !== undefined && costPrice > 0;

    const customProduct: POSProduct = {
      _id: customId,
      name: description,
      slug: isOutsource ? 'outsource' : 'custom',
      price: salePrice,
      stock: 999,
      category: isOutsource ? 'Outsource' : 'Custom',
      productType: 'single',
    };

    const newItem: CartItem = {
      id: customId,
      product: customProduct,
      quantity: 1,
      unitPrice: salePrice,
      discount: 0,
      subtotal: salePrice,
      ...(isOutsource
        ? { isOutsource: true, outsourceDescription: description, costPrice }
        : { isLabour: true, labourDescription: description }),
    };

    setCart(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCart({
        items: [],
        subtotal: 0,
        tax: 0,
        taxRate: 0,
        appliedTaxes: [],
        discount: 0,
        total: 0,
      });
      setCustomer(null);
    }
  };

  const handleHoldCart = () => {
    if (cart.items.length === 0) {
      alert('Cart is empty');
      return;
    }

    const customerName = customer
      ? `${customer.firstName} ${customer.lastName}`
      : undefined;

    holdCart({ ...cart, customer: customer ?? undefined }, customerName);
    setHeldCarts(getHeldCarts());

    // Clear current cart
    setCart({
      items: [],
      subtotal: 0,
      tax: 0,
      taxRate: 0,
      appliedTaxes: [],
      discount: 0,
      total: 0,
    });
    setCustomer(null);

    alert('Order held successfully');
    handleTabChange('held');
  };

  const handleRetrieveCart = (cartId: string) => {
    const held = retrieveHeldCart(cartId);
    if (held) {
      setCart(held.cart);
      setCustomer(held.cart.customer || null);
      setHeldCarts(getHeldCarts());
      handleTabChange('products');
    }
  };

  const handleDeleteHeldCart = (cartId: string) => {
    if (confirm('Are you sure you want to delete this held order?')) {
      clearHeldCart(cartId);
      setHeldCarts(getHeldCarts());
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (
    paymentMethod: PaymentMethodType,
    cashAmount?: number,
    bankTransferScreenshot?: string,
    isPartialPayment?: boolean,
    paidAmount?: number,
    customerInfo?: CustomerInfo
  ) => {
    try {
      console.log('=== Frontend: Creating POS Order ===');
      console.log('Cart items:', cart.items);
      console.log('Payment method:', paymentMethod);
      console.log('Cash amount:', cashAmount);
      console.log('Customer info:', customerInfo);

      // Log outsource items specifically
      const outsourceItems = cart.items.filter(item => item.isOutsource);
      if (outsourceItems.length > 0) {
        console.log('=== OUTSOURCE ITEMS IN CART ===');
        outsourceItems.forEach((item, idx) => {
          console.log(`Outsource ${idx + 1}:`, {
            description: item.outsourceDescription,
            costPrice: item.costPrice,
            salePrice: item.unitPrice,
            isOutsource: item.isOutsource
          });
        });
      }

      // Create or find customer based on customerInfo
      let customerId = customer?._id;
      if (customerInfo && !customerId) {
        try {
          // Parse name into firstName and lastName
          const nameParts = customerInfo.name.trim().split(' ');
          const firstName = nameParts[0] || customerInfo.name;
          const lastName = nameParts.slice(1).join(' ') || '';

          const customerResult = await createOrFindCustomer({
            firstName,
            lastName,
            phone: customerInfo.phone,
            vehicleName: customerInfo.vehicleName
          });
          customerId = customerResult.data._id;
          console.log('Customer created/found:', customerResult);
        } catch (customerError) {
          console.error('Failed to create/find customer:', customerError);
          alert(`Failed to save customer: ${customerError instanceof Error ? customerError.message : 'Unknown error'}`);
          return;
        }
      }

      const orderData: POSOrderData = {
        items: cart.items.map(item => ({
          ...(item.isLabour
            ? { isLabour: true, labourDescription: item.labourDescription }
            : item.isOutsource
            ? { isOutsource: true, outsourceDescription: item.outsourceDescription, costPrice: item.costPrice }
            : { product: item.product._id, variantId: item.variantId }),
          sku: item.variant?.sku || item.product.sku || '',
          quantity: item.quantity,
          price: item.unitPrice,
          size: item.size,
          color: item.color,
          discount: item.discount,
        })),
        customer: customerId,
        customerInfo: customerInfo, // Store customer info for invoice display
        subtotal: cart.subtotal,
        tax: cart.tax,
        appliedTaxes: cart.appliedTaxes, // Include tax breakdown
        discount: cart.discount,
        discountType: cart.discountType || null,
        discountReason: cart.discountReason || '',
        total: cart.total,
        paymentMethod,
        cashAmount: (paymentMethod === 'cash' || paymentMethod === 'bank_transfer') ? cashAmount : undefined,
        cardAmount: paymentMethod === 'card' ? cart.total : undefined,
        change: cashAmount && (paymentMethod === 'cash' || paymentMethod === 'bank_transfer') ? cashAmount - cart.total : undefined,
        bankTransferScreenshot: paymentMethod === 'bank_transfer' ? bankTransferScreenshot : undefined,
        isPOS: true,
        // Partial Payment Fields
        isPartialPayment: isPartialPayment,
        paidAmount: isPartialPayment ? paidAmount : undefined,
      };

      // Log outsource items in final order data
      const outsourceInOrder = orderData.items.filter(item => item.isOutsource);
      if (outsourceInOrder.length > 0) {
        console.log('=== OUTSOURCE ITEMS IN ORDER DATA ===');
        console.log(JSON.stringify(outsourceInOrder, null, 2));
      }

      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));

      const order = await createPOSOrder(orderData);

      console.log('Order created successfully:', order);

      // Success!
      const pendingAmount = isPartialPayment && paidAmount ? cart.total - paidAmount : 0;
      if (pendingAmount > 0) {
        alert(`Order #${order.orderNumber} created with pending payment!\nPaid: Rs ${paidAmount?.toFixed(2)}\nPending: Rs ${pendingAmount.toFixed(2)}`);
      } else {
        alert(`Order #${order.orderNumber} completed successfully!`);
      }

      // Clear cart and reset
      setCart({
        items: [],
        subtotal: 0,
        tax: 0,
        taxRate: 0,
        appliedTaxes: [],
        discount: 0,
        total: 0,
      });
      setCustomer(null);
      setShowPaymentModal(false);

      // Reload recent orders
      loadRecentOrders();
      handleTabChange('history');
    } catch (error) {
      console.error('=== Frontend: Order Creation Failed ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : '');

      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleTabChange('products')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => handleTabChange('held')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                activeTab === 'held'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Archive className="h-4 w-4 inline mr-2" />
              Held Orders
              {heldCarts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#dc2626] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {heldCarts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Receipt className="h-4 w-4 inline mr-2" />
              Today&apos;s Sales
            </button>
            <button
              onClick={() => handleTabChange('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Pending Payments
            </button>
          </div>

          {/* Search - Only show for products tab */}
          {activeTab === 'products' && (
            <ProductSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onBarcodeScanned={(barcode) => {
                // TODO: Implement barcode scanning
                console.log('Barcode scanned:', barcode);
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'products' && (
            <ProductGrid
              products={products}
              onSelectProduct={handleProductSelect}
              loading={loading}
              currency={currency}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'held' && (
            <HeldOrders
              heldCarts={heldCarts}
              onRetrieve={handleRetrieveCart}
              onDelete={handleDeleteHeldCart}
              currency={currency}
            />
          )}

          {activeTab === 'history' && (
            <SalesHistory orders={recentOrders} storeName={storeName} currency={currency} />
          )}

          {activeTab === 'pending' && (
            <PendingPaymentsTab
              currency={currency}
              onPaymentComplete={() => {
                loadRecentOrders();
              }}
            />
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex-shrink-0">
        <CartPanel
          cart={cart}
          customer={customer}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onHoldCart={handleHoldCart}
          onCheckout={handleCheckout}
          onSelectCustomer={() => setShowCustomerSelector(true)}
          currency={currency}
          availableTaxes={availableTaxes}
          selectedTaxIds={selectedTaxIds}
          onTaxSelectionChange={setSelectedTaxIds}
          onAddCustomItem={addCustomItemToCart}
          onApplyDiscount={(discount, discountType, discountReason) => {
            setCart(prev => {
              const total = prev.subtotal + prev.tax - discount;
              return { ...prev, discount, discountType, discountReason, total: Math.max(0, total) };
            });
          }}
        />
      </div>

      {/* Modals */}
      <CustomerSelector
        isOpen={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        onSelect={setCustomer}
        currentCustomer={customer}
      />

      <VariantSelector
        isOpen={showVariantSelector}
        product={selectedProduct}
        onClose={() => {
          setShowVariantSelector(false);
          setSelectedProduct(null);
        }}
        onSelect={handleVariantSelect}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        cart={cart}
        customer={customer}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        currency={currency}
      />
    </div>
  );
}
