// POS Cart Service (Hold/Retrieve carts)
import { HeldCart, POSCart } from "../types";

const HELD_CARTS_KEY = 'pos_held_carts';

/**
 * Hold a cart (save to localStorage for now, can be moved to backend later)
 */
export function holdCart(cart: POSCart, customerName?: string): HeldCart {
  const heldCart: HeldCart = {
    id: Date.now().toString(),
    cart,
    heldAt: new Date().toISOString(),
    heldBy: 'Current User', // TODO: Get from auth context
    customerName,
  };

  const heldCarts = getHeldCarts();
  heldCarts.push(heldCart);

  if (typeof window !== 'undefined') {
    localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(heldCarts));
  }

  return heldCart;
}

/**
 * Get all held carts
 */
export function getHeldCarts(): HeldCart[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = localStorage.getItem(HELD_CARTS_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Retrieve and remove a held cart
 */
export function retrieveHeldCart(id: string): HeldCart | null {
  const heldCarts = getHeldCarts();
  const cart = heldCarts.find(c => c.id === id);

  if (!cart) {
    return null;
  }

  // Remove from storage
  clearHeldCart(id);

  return cart;
}

/**
 * Clear a specific held cart
 */
export function clearHeldCart(id: string): void {
  const heldCarts = getHeldCarts();
  const filtered = heldCarts.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(filtered));
  }
}

/**
 * Clear all held carts
 */
export function clearAllHeldCarts(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HELD_CARTS_KEY);
  }
}
