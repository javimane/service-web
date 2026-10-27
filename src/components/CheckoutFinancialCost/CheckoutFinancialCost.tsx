import { calculateCheckoutCftea } from "@/utils/checkoutFinancialCost";
import "./CheckoutFinancialCost.css";

interface CheckoutFinancialCostProps {
  totalAmount: number;
  financingAmount: number | null;
  installments: number;
  paymentMethod: "card" | "paycloud_qr";
  pending?: boolean;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
const percent = (value: number) =>
  `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

export default function CheckoutFinancialCost({
  totalAmount,
  financingAmount,
  installments,
  paymentMethod,
  pending = false,
}: CheckoutFinancialCostProps) {
  const count = paymentMethod === "card" ? installments : 1;
  const surcharge = paymentMethod === "card" ? financingAmount : 0;
  const cashAmount = totalAmount - (surcharge ?? 0);
  const unavailable =
    pending ||
    surcharge === null ||
    !Number.isFinite(totalAmount) ||
    !Number.isFinite(surcharge) ||
    surcharge < 0 ||
    cashAmount <= 0 ||
    !Number.isInteger(count) ||
    count < 1;
  const cftea = unavailable
    ? null
    : calculateCheckoutCftea(cashAmount, totalAmount, count);
  const noSurcharge = !unavailable && surcharge === 0;

  return (
    <section
      className="checkout-financial-cost"
      aria-label="Costo de financiación"
      aria-live="polite"
      aria-busy={pending}
    >
      <div className="checkout-financial-cost__row">
        <span>Costo de financiación</span>
        <strong>
          {unavailable ? "Pendiente de cálculo" : money(surcharge!)}
        </strong>
      </div>
      {!unavailable && (
        <>
          <div className="checkout-financial-cost__row">
            <span>Pagás</span>
            <div className="checkout-financial-cost__plan">
              <strong>
                {count === 1
                  ? `1 pago de ${money(totalAmount)}`
                  : `${count} cuotas de ${money(totalAmount / count)}`}
              </strong>
              <span
                className={
                  noSurcharge ? "checkout-financial-cost__same-price" : ""
                }
              >
                {noSurcharge
                  ? "Mismo precio · sin recargo"
                  : `Recargo total: ${percent((surcharge! / cashAmount) * 100)}`}
              </span>
            </div>
          </div>
          <div className="checkout-financial-cost__rates">
            <strong className="checkout-financial-cost__cftea">
              CFTEA{noSurcharge ? "" : " estimado"}:{" "}
              {cftea === null ? "No disponible" : percent(cftea)}
            </strong>
            <span className="checkout-financial-cost__tea">
              TEA: {noSurcharge ? "0,00%" : "No informada por el financiador"}
            </span>
          </div>
          <p className="checkout-financial-cost__note">
            {count === 1 && noSurcharge
              ? paymentMethod === "paycloud_qr"
                ? "Pago único con QR, sin financiación."
                : "Pago único, sin recargo de financiación."
              : "Costo financiero total efectivo anual de esta compra, calculado con cuotas iguales cada 30 días. El primer vencimiento depende del cierre de tu tarjeta."}
          </p>
        </>
      )}
    </section>
  );
}
