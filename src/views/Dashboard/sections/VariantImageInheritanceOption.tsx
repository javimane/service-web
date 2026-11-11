import "./VariantImageInheritanceOption.css";
export function VariantImageInheritanceOption({
  checked,
  images,
  disabled,
  onChange,
}: {
  checked: boolean;
  images: string[];
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="variant-image-inheritance">
      <label className="product-creator__inherit-option product-creator__field--full">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled || (images.length === 0 && !checked)}
          onChange={(event) => onChange(event.target.checked)}
        />
        Usar las imágenes del producto principal
      </label>
      <p className="product-creator__images-hint">
        {images.length
          ? "Se guardarán las mismas imágenes, sin volver a subirlas. Después podés cambiarlas por separado en esta variante."
          : "El producto principal todavía no tiene imágenes para reutilizar."}
      </p>
      {checked && (
        <div className="dash-products__image-preview-grid">
          {images.map((url, index) => (
            <div key={url} className="dash-products__image-preview">
              <img
                src={url}
                alt={"Imagen del producto principal " + (index + 1)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
