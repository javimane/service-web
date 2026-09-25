"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { commerceService, ProductVariant } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import ProductCreator from "./ProductCreator";
import "./ProductVariantsSection.css";

interface ProductVariantsSectionProps {
  productId?: string;
  onBack: () => void;
}

export default function ProductVariantsSection({ productId, onBack }: ProductVariantsSectionProps) {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useAlert();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const { data: family = [], isLoading } = useQuery<ProductVariant[]>({
    queryKey: ["product-family", productId],
    queryFn: () => commerceService.variants(productId!),
    enabled: Boolean(productId),
  });
  const parent = family.find((item) => item.is_main);
  const children = family.filter((item) => !item.is_main);

  if (mode !== "list" && parent) {
    return (
      <ProductCreator
        onBack={() => {
          setMode("list");
          setEditing(null);
          queryClient.invalidateQueries({ queryKey: ["product-family", productId] });
        }}
        productToEdit={mode === "edit" ? editing : undefined}
        variantParent={parent}
      />
    );
  }

  const unlink = async (product: ProductVariant) => {
    if (!window.confirm(`¿Desvincular ${product.name} del producto principal? Seguirá publicado como producto independiente.`)) return;
    try {
      await commerceService.deleteVariant(product.id);
      await queryClient.invalidateQueries({ queryKey: ["product-family", productId] });
      showSuccess("La variante quedó como producto independiente.");
    } catch (error: any) {
      showError(error?.message || "No se pudo desvincular la variante.");
    }
  };

  return (
    <section className="product-family">
      <header className="product-family__header">
        <button type="button" className="product-family__back" onClick={onBack}>
          <ArrowLeft size={18} /> Volver a productos
        </button>
        <div>
          <h1 className="product-family__title"><Layers size={23} /> Variantes de {parent?.name || "producto"}</h1>
          <p className="product-family__description">Cada opción es un producto con código de barras, precio y stock propios.</p>
        </div>
        <button type="button" data-action-tone="add" className="product-family__add" disabled={!parent} onClick={() => setMode("create") }>
          <Plus size={18} /> Agregar variante
        </button>
      </header>

      {isLoading ? <p className="product-family__empty">Cargando variantes…</p> : children.length === 0 ? (
        <p className="product-family__empty">Todavía no hay variantes. Agregá una con el mismo formulario que usás para un producto.</p>
      ) : (
        <div className="product-family__list">
          {children.map((child) => (
            <article className="product-family__item" key={child.id}>
              {child.image_url && <img className="product-family__image" src={child.image_url} alt="" />}
              <div className="product-family__details">
                <h2>{child.name}</h2>
                <p>{child.attributes?.map((attribute) => `${attribute.name}: ${attribute.value}`).join(" · ") || "Sin características"}</p>
                <p>EAN: {child.ean || "Sin código"} · Stock: {child.stock} · ${Number(child.price || 0).toLocaleString("es-AR")}</p>
              </div>
              <div className="product-family__actions">
                <button type="button" onClick={() => { setEditing(child); setMode("edit"); }}><Pencil size={16} /> Editar</button>
                <button type="button" data-action-tone="cancel" onClick={() => unlink(child)}><Trash2 size={16} /> Desvincular</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
