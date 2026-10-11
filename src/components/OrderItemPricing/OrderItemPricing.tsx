import type { OrderPricingSnapshot } from "@/services/commerceService";
import "./OrderItemPricing.css";

const money = (value: number) => `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderItemPricing({ pricing, unitPrice }: {
  pricing?: OrderPricingSnapshot | null;
  unitPrice: number;
}) {
  if (!pricing || pricing.version !== 1) return <div className="order-item-pricing">Precio unitario: {money(unitPrice)}</div>;
  return <div className="order-item-pricing">
    <span>Precio original: {money(pricing.original_unit_price)} c/u</span>
    {pricing.price_type === "offer" && <span>Precio de oferta: {money(pricing.applied_unit_price)} c/u · Descuento: {money(pricing.unit_discount_amount)} ({pricing.unit_discount_percent}%)</span>}
    {pricing.price_type === "wholesale" && <span>Precio por mayor: {money(pricing.applied_unit_price)} c/u</span>}
    {pricing.promotion && <span>Promoción {pricing.promotion} · Pagás {pricing.paid_units} unidades · {pricing.free_units} bonificadas</span>}
    {pricing.total_discount_amount > 0 && <span>Ahorro total del ítem: {money(pricing.total_discount_amount)}</span>}
  </div>;
}
