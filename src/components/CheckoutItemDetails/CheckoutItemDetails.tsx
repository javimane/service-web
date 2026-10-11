import "./CheckoutItemDetails.css";

type ProductDetails = {
  brand?: string | null; attributes?: unknown;
  color?: string | null; size_letter?: string | null; size_number?: number | null;
};

export function checkoutProductCharacteristics(product?: ProductDetails | null) {
  const details: { name: string; value: string }[] = [];
  const add = (name: unknown, value: unknown) => {
    if (typeof name !== "string" || !name.trim() || value == null ||
        !["string", "number", "boolean"].includes(typeof value) || !String(value).trim()) return;
    if (!details.some(item => item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())) {
      details.push({ name: name.trim(), value: String(value).trim() });
    }
  };
  add("Marca", product?.brand);
  if (Array.isArray(product?.attributes)) {
    product.attributes.forEach(attribute => add(attribute?.name, attribute?.value));
  } else if (product?.attributes && typeof product.attributes === "object") {
    Object.entries(product.attributes).forEach(([name, value]) => add(name, value));
  }
  add("Color", product?.color);
  add("Talle", product?.size_letter ?? product?.size_number);
  return details;
}

export default function CheckoutItemDetails({ product, description }: {
  product?: ProductDetails | null; description?: string | null;
}) {
  const details = checkoutProductCharacteristics(product);
  if (!details.length && !description?.trim()) return null;
  return <div className="checkout-item-details">
    {details.length > 0 && <dl aria-label="Características del producto" className="checkout-item-details__list">
      {details.map(detail => <div className="checkout-item-details__row" key={detail.name}>
        <dt>{detail.name}</dt><dd>{detail.value}</dd>
      </div>)}
    </dl>}
    {description?.trim() && <p className="checkout-item-details__description">{description}</p>}
  </div>;
}
