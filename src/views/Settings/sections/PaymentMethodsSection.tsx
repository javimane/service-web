import MultiChoiceChips from "./MultiChoiceChips";

const paymentOptions = [
  "Efectivo",
  "Transferencias",
  "Débito",
  "Crédito",
  "Cheque",
];

export default function PaymentMethodsSection({
  selectedPayments,
  onTogglePayment,
}) {
  return (
    <article className="settings-card payment-methods-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">💳</span>
          <h2>Métodos de Pago</h2>
        </div>
      </div>

      <div className="settings-fields">
        <div className="settings-field">
          <span>Medios de pago que acepta</span>
          <MultiChoiceChips
            values={selectedPayments}
            onToggle={onTogglePayment}
            options={paymentOptions}
          />
        </div>
      </div>
    </article>
  );
}
