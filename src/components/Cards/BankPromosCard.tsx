import React from "react";
import { Tag, ChevronRight } from "lucide-react";
import "./BankPromosCard.css";

const BankPromosCard = ({ promotions, onOpenPromos }) => {
  if (!promotions || promotions.length === 0) return null;

  const maxDiscount = Math.max(
    ...promotions.map((p: any) => Number(p.percentaje_discount || p.percentage_discount || 0))
  );

  return (
    <div className="bank-promos-card" onClick={onOpenPromos}>
      <h3 className="card-subtitle">PROMOCIONES BANCARIAS</h3>
      <div className="promo-preview">
        <div className="promo-preview__icon">
          <Tag size={18} />
        </div>
        <div className="promo-preview__content">
          <p>Ver promociones semanales</p>
          {maxDiscount > 0 && (
            <span>Hasta {maxDiscount}% OFF</span>
          )}
        </div>
        <ChevronRight size={18} className="chevron" />
      </div>
    </div>
  );
};

export default BankPromosCard;
