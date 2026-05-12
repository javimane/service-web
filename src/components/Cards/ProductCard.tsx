import React from 'react';
import { Star, ShoppingBag } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onOpenDetail, variant = 'default' }) => {
  const images = product.Images || [];
  const primaryImage = images[0]?.image_url || product.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";
  const price = product.price || 0;
  const discount = product.discount_percentage || 0;
  const originalPrice = product.original_price;

  return (
    <div 
      className={`product-card-premium ${variant === 'small' ? 'product-card-premium--small' : ''}`} 
      onClick={() => onOpenDetail && onOpenDetail(product)}
    >
      <div className="product-card-premium__image">
        <img src={primaryImage} alt={product.name} />
        {discount > 0 && <span className="product-badge">-{discount}%</span>}
      </div>
      <div className="product-card-premium__content">
        <h3 className="product-title">{product.name}</h3>
        <div className="product-pricing">
          {originalPrice && <span className="original-price">${originalPrice.toLocaleString()}</span>}
          <span className="current-price">${price.toLocaleString()}</span>
        </div>
        <div className="product-footer">
          <div className="rating">
            <Star size={12} fill="#e94823" color="#e94823" />
            <span>5.0</span>
          </div>
          <button className="add-to-cart">
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
