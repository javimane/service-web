import React from 'react';
import { CreditCard, Banknote, Landmark } from 'lucide-react';
import './PaymentMethodsCard.css';

const PaymentMethodsCard = ({ methods }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'credit': return <CreditCard size={16} />;
      case 'cash': return <Banknote size={16} />;
      case 'bank': return <Landmark size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  return (
    <div className="payment-methods-card">
      <h3 className="card-subtitle">MEDIOS DE PAGO</h3>
      <div className="payment-methods-grid">
        {methods.map((method) => (
          <div key={method.id} className="payment-method-item" title={method.label}>
            <div className="method-icon">
              {getIcon(method.type)}
            </div>
            <span>{method.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodsCard;
