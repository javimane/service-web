import React from 'react';
import { Tag, ChevronRight } from 'lucide-react';
import './BankPromosCard.css';

const BankPromosCard = ({ promotions, onOpenPromos }) => {
  return (
    <div className="bank-promos-card" onClick={onOpenPromos}>
      <h3 className="card-subtitle">PROMOCIONES BANCARIAS</h3>
      <div className="promo-preview">
        <div className="promo-preview__icon">
          <Tag size={18} />
        </div>
        <div className="promo-preview__content">
          <p>Ver promociones semanales</p>
          <span>Hasta {Math.max(...promotions.map(p => parseInt(p.discount)))}% OFF</span>
        </div>
        <ChevronRight size={18} className="chevron" />
      </div>
    </div>
  );
};

export default BankPromosCard;
