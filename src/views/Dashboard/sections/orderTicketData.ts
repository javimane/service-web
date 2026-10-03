import type { OrderSummary } from "@/services/commerceService";

type Product = NonNullable<NonNullable<OrderSummary["items"]>[number]["product"]> | NonNullable<NonNullable<OrderSummary["professional_product"]>["product"]>;

export const isPrintableOrder = (order: OrderSummary) =>
  !["pending", "pending_payment", "cancelled", "refunded"].includes(order.status);

export function getBuyerName(order: OrderSummary): string {
  const buyer = order.buyer || order.user;
  const firstLast = [buyer?.first_name, buyer?.last_name].filter(Boolean).join(" ").trim();
  const profileName = firstLast || buyer?.full_name || buyer?.display_name;
  if (profileName && !/^anonymous$/i.test(profileName.trim())) return profileName;
  const billing = order.billing_data || order.billing_profile;
  return billing?.full_name || billing?.company_name || "No informado";
}

export function getBuyerPhone(order: OrderSummary): string {
  return order.buyer?.phone || order.buyer?.phone_number ||
    order.user?.phone || order.user?.phone_number ||
    order.delivery_address?.phone || "No informado";
}

export function getBuyerEmail(order: OrderSummary): string {
  return order.buyer?.email || order.user?.email || "No informado";
}

export function getProductImage(product?: Product | null): string | null {
  const firstImage = product?.products_images
    ?.filter((image) => image.image_url)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url;
  return firstImage || (product && "image_url" in product ? product.image_url : null) || null;
}

export function getProductAttributes(product?: Product | null): string {
  const attributes = product?.attributes;
  if (Array.isArray(attributes)) {
    const description = attributes.filter((item) => item?.name && item?.value)
      .map((item) => `${item.name}: ${item.value}`).join(" · ");
    if (description) return description;
  }
  if (attributes && typeof attributes === "object") {
    const description = Object.entries(attributes)
      .filter(([, value]) => value != null && value !== "")
      .map(([name, value]) => `${name}: ${value}`).join(" · ");
    if (description) return description;
  }
  return [
    product?.color ? `Color: ${product.color}` : "",
    product?.size_letter ? `Talle: ${product.size_letter}` : "",
    product?.size_number != null ? `Talle: ${product.size_number}` : "",
  ].filter(Boolean).join(" · ");
}

export function getSaleLocation(order: OrderSummary) {
  const location = order.branch || order.origin_address;
  const name = order.branch?.name || "Sucursal Principal";
  const street = [location?.street_name, location?.street_number]
    .filter(Boolean).join(" ");
  const details = [location?.floor_apartment,
    location?.zip_code ? `CP ${location.zip_code}` : null]
    .filter(Boolean).join(", ");
  return {
    name,
    address: [street, details].filter(Boolean).join(", ") || "Dirección no informada",
    phone: location?.phone || null,
  };
}

export function getOrderLines(order: OrderSummary) {
  if (order.items?.length) {
    return order.items.map((item) => ({
      id: item.id,
      name: item.product?.name || item.service?.name || item.product_name || "Artículo sin nombre",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      ean: item.product?.ean || null,
      brand: item.product?.brand || null,
      attributes: getProductAttributes(item.product),
      imageUrl: getProductImage(item.product) || item.product_image || null,
    }));
  }
  const product = order.professional_product?.product;
  return [{
    id: order.id,
    name: product?.name || order.service?.name || "Artículo sin nombre",
    quantity: Number(order.quantity ?? 1),
    unitPrice: Number(order.total_amount ?? 0) / Math.max(1, Number(order.quantity ?? 1)),
    subtotal: Number(order.total_amount ?? 0),
    ean: product?.ean || null,
    brand: product?.brand || null,
    attributes: getProductAttributes(product),
    imageUrl: getProductImage(product),
  }];
}

export function getDeliveryAddress(order: OrderSummary): string {
  if (order.delivery_type === "pickup") return "Retiro en sucursal";
  if (order.delivery_type === "coordinate_with_merchant") return "A coordinar con el vendedor";
  const address = order.delivery_address || order.shipping_address;
  if (!address) return "Dirección no informada";
  const street = [address.street_name || address.street, address.street_number || address.number]
    .filter(Boolean).join(" ");
  const details = [address.floor_apartment,
    address.floor ? `Piso ${address.floor}` : null,
    address.apartment_number ? `Dpto. ${address.apartment_number}` : null,
    address.between_streets ? `Entre ${address.between_streets}` : null,
    address.city, address.department, address.province || ("state" in address ? address.state : null),
    address.zip_code || address.postal_code ? `CP ${address.zip_code || address.postal_code}` : null,
  ].filter(Boolean);
  return [street, ...details].filter(Boolean).join(", ") || "Dirección no informada";
}

export const getOrderNumber = (order: OrderSummary) =>
  order.order_number || `#ORD-${order.id.slice(0, 8).toUpperCase()}`;

export const getOrderQrPayload = (order: OrderSummary) => JSON.stringify({
  order_id: order.id,
  order_number: getOrderNumber(order),
  security_code: order.pickup_code || "",
});
