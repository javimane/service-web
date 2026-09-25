import type { Cart, CartItem } from "@/services/commerceService";
import { calculateProductPricing } from "./productPricing";

const GUEST_CART_KEY = "sercio-guest-cart";

const emptyGuestCart = (): Cart => ({
  id: null,
  professional_id: null,
  items: [],
  total: 0,
});

const calculateTotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + Number(item.subtotal || 0), 0);

const priceItem = (item: CartItem): CartItem => item.product
  ? { ...item, subtotal: calculateProductPricing(item.product, item.quantity).subtotal }
  : item;

export function getGuestCart(): Cart {
  if (typeof window === "undefined") return emptyGuestCart();

  try {
    const storedCart = window.localStorage.getItem(GUEST_CART_KEY);
    if (!storedCart) return emptyGuestCart();

    const parsed = JSON.parse(storedCart) as Cart;
    if (!Array.isArray(parsed.items)) return emptyGuestCart();

    return {
      ...parsed,
      id: null,
      items: parsed.items.map(priceItem),
      total: calculateTotal(parsed.items.map(priceItem)),
    };
  } catch {
    return emptyGuestCart();
  }
}

function saveGuestCart(cart: Cart): Cart {
  const nextCart = { ...cart, total: calculateTotal(cart.items) };
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextCart));
  return nextCart;
}

export function addGuestCartItem(
  professionalId: number | null,
  newItem: CartItem,
): Cart {
  const cart = getGuestCart();

  if (
    cart.items.length > 0 &&
    cart.professional_id &&
    professionalId &&
    cart.professional_id !== professionalId
  ) {
    throw new Error("El carrito solo puede contener artículos de un comercio.");
  }

  const existingIndex = cart.items.findIndex(
    (item) =>
      item.product_id === newItem.product_id &&
      item.professional_product_id === newItem.professional_product_id &&
      item.service_id === newItem.service_id,
  );

  const items = [...cart.items];
  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const quantity = existing.quantity + newItem.quantity;
    items[existingIndex] = priceItem({
      ...existing,
      quantity,
    });
  } else {
    items.push(priceItem(newItem));
  }

  return saveGuestCart({
    id: null,
    professional_id: cart.professional_id || professionalId,
    items,
    total: 0,
  });
}

export function updateGuestCartItem(id: string, quantity: number): Cart {
  const cart = getGuestCart();
  const items = cart.items.map((item) => {
    if (item.id !== id) return item;
    return priceItem({ ...item, quantity });
  });
  return saveGuestCart({ ...cart, items });
}

export function removeGuestCartItem(id: string): Cart {
  const cart = getGuestCart();
  const items = cart.items.filter((item) => item.id !== id);
  return saveGuestCart({
    ...cart,
    professional_id: items.length > 0 ? cart.professional_id : null,
    items,
  });
}

export function clearGuestCart(): Cart {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(GUEST_CART_KEY);
  }
  return emptyGuestCart();
}
