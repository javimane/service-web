"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Layers, AlertCircle, Check } from "lucide-react";
import { commerceService, ProductVariant } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import "./ProductVariantsModal.css";

interface ProductVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalProductId: string;
  productName: string;
}

export default function ProductVariantsModal({
  isOpen,
  onClose,
  professionalProductId,
  productName,
}: ProductVariantsModalProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [attrName, setAttrName] = useState("Color");
  const [attrValue, setAttrValue] = useState("");
  const [priceDiff, setPriceDiff] = useState<number | "">(0);
  const [stock, setStock] = useState<number | "">(10);
  const [sku, setSku] = useState("");

  const {
    data: variants = [],
    isLoading,
    refetch,
  } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", professionalProductId],
    queryFn: () => commerceService.variants(professionalProductId),
    enabled: isOpen && Boolean(professionalProductId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      commerceService.createVariant({
        professional_product_id: professionalProductId,
        name: `${attrName}: ${attrValue}`,
        attribute_name: attrName,
        attribute_value: attrValue,
        price_difference: typeof priceDiff === "number" ? priceDiff : 0,
        stock: typeof stock === "number" ? stock : 0,
        sku: sku.trim() || undefined,
      }),
    onSuccess: () => {
      showSuccess("Variante agregada.");
      refetch();
      setAttrValue("");
      setSku("");
      setPriceDiff(0);
    },
    onError: () => showError("No se pudo agregar la variante."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commerceService.deleteVariant(id),
    onSuccess: () => {
      showSuccess("Variante eliminada.");
      refetch();
    },
    onError: () => showError("No se pudo eliminar la variante."),
  });

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrValue.trim()) {
      showError("El valor del atributo es obligatorio (ej: Azul, XL, 500ml).");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestionar Variantes — ${productName}`}
    >
      <div className="product-variants-modal">
        <p className="variants-intro">
          Configurá variantes con atributos diferenciados (Color, Talle, Medida, etc.),
          con su propio stock y variación de precio respecto al producto base.
        </p>

        {/* Add Variant Form */}
        <form className="variant-add-form" onSubmit={handleAddVariant}>
          <div className="variant-form-row">
            <div className="variant-form-group flex-1">
              <label className="variant-label">Atributo</label>
              <select
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
              >
                <option value="Color">Color</option>
                <option value="Talle">Talle</option>
                <option value="Capacidad">Capacidad</option>
                <option value="Medida">Medida</option>
                <option value="Material">Material</option>
                <option value="Modelo">Modelo</option>
              </select>
            </div>

            <div className="variant-form-group flex-2">
              <label className="variant-label">Valor del atributo*</label>
              <input
                type="text"
                required
                placeholder="Ej: Negro / XL / 1 Litro"
                value={attrValue}
                onChange={(e) => setAttrValue(e.target.value)}
              />
            </div>
          </div>

          <div className="variant-form-row">
            <div className="variant-form-group flex-1">
              <label className="variant-label">Diferencia de precio ($)</label>
              <input
                type="number"
                step="any"
                placeholder="0 (sin recargo)"
                value={priceDiff}
                onChange={(e) => setPriceDiff(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="variant-form-group flex-1">
              <label className="variant-label">Stock específico*</label>
              <input
                type="number"
                min="0"
                required
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="variant-form-group flex-1">
              <label className="variant-label">SKU (opcional)</label>
              <input
                type="text"
                placeholder="PROD-XL-NEG"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary variant-add-btn"
            disabled={createMutation.isPending}
          >
            <Plus size={16} />
            <span>Agregar variante</span>
          </button>
        </form>

        {/* Existing Variants Table */}
        <div className="variants-list-wrap">
          <h4 className="variants-list-title">Variantes creadas ({variants.length})</h4>

          {isLoading ? (
            <p className="variants-loading">Cargando variantes...</p>
          ) : variants.length === 0 ? (
            <div className="variants-empty">
              <Layers size={32} />
              <p>Este producto aún no tiene variantes cargadas.</p>
            </div>
          ) : (
            <div className="variants-table-wrap">
              <table className="variants-table">
                <thead>
                  <tr>
                    <th>Atributo</th>
                    <th>Valor</th>
                    <th>Dif. Precio</th>
                    <th>Stock</th>
                    <th>SKU</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.attribute_name}</strong></td>
                      <td>{v.attribute_value}</td>
                      <td>
                        {v.price_difference > 0
                          ? `+$${v.price_difference}`
                          : v.price_difference < 0
                          ? `-$${Math.abs(v.price_difference)}`
                          : "$0"}
                      </td>
                      <td>
                        <span className="variant-stock-pill">{v.stock} u.</span>
                      </td>
                      <td>{v.sku || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="variant-delete-btn"
                          title="Eliminar variante"
                          onClick={() => deleteMutation.mutate(v.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions-row">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </Modal>
  );
}
