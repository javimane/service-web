"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  Package,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import { useAuth } from "../../../context/AuthContext";
import {
  getProductsAction,
  getProductsByProfessionalAction,
} from "../../../app/actions/products";
import "./AddItemModal.css";

type Tab = "services" | "products";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: any[]) => void;
  initialTab?: Tab;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  initialTab = "services",
}: AddItemModalProps) {
  const { sessionStatus } = useAuth();
  const professionalId =
    sessionStatus?.subscription?.professional_id ||
    sessionStatus?.professional_id;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Sync activeTab with initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ---- Services tab state ----
  const [tempItems, setTempItems] = useState([{ name: "", qty: 1, rate: 0 }]);

  // ---- Products tab state ----
  const [productSource, setProductSource] = useState<"mine" | "all">("mine");
  const [productSearch, setProductSearch] = useState("");
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { id: number; name: string; qty: number; rate: number; image?: string }[]
  >([]);

  const mapProductData = (item: any) => {
    // Image sorting logic (order 1 first)
    const images = Array.isArray(item.Product?.Images)
      ? [...item.Product.Images]
          .sort(
            (a: any, b: any) =>
              Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0),
          )
          .map((img: any) => String(img?.image_url || "").trim())
          .filter(Boolean)
      : [];

    return {
      id: item.product_id || item.id,
      title: item.Product?.name || item.name || "Sin nombre",
      price: item.price || item.Product?.price || 0,
      image: images[0] || item.Product?.image_url || "",
      category: (item.Product?.CategoryProduct?.name || "General").trim(),
    };
  };

  // ---- Services handlers ----
  const handleUpdateItem = (index, field, value) => {
    const updated = [...tempItems];
    updated[index][field] = value;
    setTempItems(updated);
  };

  const addNewRow = () => {
    setTempItems([...tempItems, { name: "", qty: 1, rate: 0 }]);
  };

  const removeRow = (index) => {
    if (tempItems.length === 1) {
      setTempItems([{ name: "", qty: 1, rate: 0 }]);
      return;
    }
    setTempItems(tempItems.filter((_, i) => i !== index));
  };

  // ---- Products handlers ----
  const fetchProducts = async () => {
    setDbLoading(true);
    try {
      let data: any[] = [];
      if (productSource === "mine" && professionalId) {
        const result = await getProductsByProfessionalAction({
          professionalId,
        });
        const rawData = result?.data as any;
        data = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];
      } else {
        const result = await getProductsAction(professionalId);
        data = result?.data || [];
      }

      let filtered = data.map(mapProductData);

      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        filtered = filtered.filter((p) => p.title.toLowerCase().includes(q));
      }

      setDbProducts(filtered.slice(0, 30));
    } catch (error) {
      console.error("Error fetching products:", error);
      setDbProducts([]);
    }
    setDbLoading(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === "products") {
      fetchProducts();
    }
  }, [isOpen, activeTab, productSource]);

  const searchDbProducts = () => {
    fetchProducts();
  };

  const addProductToSelection = (product: any) => {
    if (selectedProducts.some((p) => p.id === product.id)) return;
    setSelectedProducts((prev) => [
      ...prev,
      {
        id: product.id,
        name: product.title,
        qty: 1,
        rate: product.price,
        image: product.image,
      },
    ]);
  };

  const updateSelectedQty = (id: number, qty: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p)),
    );
  };

  const removeSelectedProduct = (id: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const isProductSelected = (id: number) =>
    selectedProducts.some((p) => p.id === id);

  // ---- Submit ----
  const handleSubmit = () => {
    if (activeTab === "services") {
      const validItems = tempItems.filter((i) => i.name.trim() !== "");
      if (validItems.length > 0) {
        onAdd(validItems);
        setTempItems([{ name: "", qty: 1, rate: 0 }]);
        onClose();
      }
    } else {
      if (selectedProducts.length > 0) {
        onAdd(
          selectedProducts.map((p) => ({
            name: p.name,
            qty: p.qty,
            rate: p.rate,
          })),
        );
        setSelectedProducts([]);
        setProductSearch("");
        onClose();
      }
    }
  };

  const handleClose = () => {
    setTempItems([{ name: "", qty: 1, rate: 0 }]);
    setSelectedProducts([]);
    setProductSearch("");
    setDbProducts([]);
    setActiveTab("services");
    onClose();
  };

  const displayProducts = dbProducts;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agregar ítems">
      <div className="add-items-form">
        {/* Tabs */}
        <div className="add-items__tabs">
          <button
            className={`add-items__tab ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <Package size={16} />
            Servicios
          </button>
          <button
            className={`add-items__tab ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <ShoppingCart size={16} />
            Productos
          </button>
        </div>

        {/* ====== SERVICES TAB ====== */}
        {activeTab === "services" && (
          <>
            <p className="form-description">
              Ingresá los servicios que querés incluir en el presupuesto.
            </p>

            <div className="items-table-header">
              <span className="col-name">NOMBRE DEL SERVICIO</span>
              <span className="col-qty">CANT.</span>
              <span className="col-rate">PRECIO ($)</span>
              <span className="col-actions"></span>
            </div>

            <div className="items-table-body">
              {tempItems.map((item, index) => (
                <div key={index} className="item-input-row">
                  <input
                    type="text"
                    placeholder="Ej: Diseño estructural"
                    className="input-name"
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="1"
                    className="input-qty"
                    value={item.qty}
                    onChange={(e) =>
                      handleUpdateItem(index, "qty", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="0"
                    className="input-rate"
                    value={item.rate}
                    onChange={(e) =>
                      handleUpdateItem(index, "rate", e.target.value)
                    }
                  />
                  <button
                    className="row-delete-btn"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button className="add-row-btn" onClick={addNewRow}>
              <Plus size={16} /> AGREGAR OTRA FILA
            </button>
          </>
        )}

        {/* ====== PRODUCTS TAB ====== */}
        {activeTab === "products" && (
          <>
            <p className="form-description">
              Buscá y seleccioná productos para incluir en el presupuesto.
            </p>

            {/* Source toggle */}
            <div className="add-items__source-toggle">
              <button
                className={productSource === "mine" ? "active" : ""}
                onClick={() => {
                  setProductSource("mine");
                  setDbProducts([]);
                }}
              >
                Mis productos
              </button>
              <button
                className={productSource === "all" ? "active" : ""}
                onClick={() => setProductSource("all")}
              >
                Toda la base de datos
              </button>
            </div>

            <div className="add-items__search-row">
              <div className="add-items__search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchProducts();
                  }}
                />
              </div>
              <button
                className="add-items__search-btn"
                onClick={fetchProducts}
                disabled={dbLoading}
              >
                {dbLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Buscar"
                )}
              </button>
            </div>

            {/* Product list */}
            <div className="add-items__product-list">
              {displayProducts.length === 0 ? (
                <div className="add-items__empty">
                  {productSource === "all" && !dbLoading
                    ? "Usá la barra de búsqueda para encontrar productos."
                    : "No se encontraron productos."}
                </div>
              ) : (
                displayProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`add-items__product-row ${isProductSelected(product.id) ? "selected" : ""}`}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt=""
                        className="add-items__product-img"
                      />
                    )}
                    <div className="add-items__product-info">
                      <span className="add-items__product-name">
                        {product.title}
                      </span>
                      <span className="add-items__product-price">
                        ${product.price.toLocaleString("es-AR")}
                      </span>
                      {product.category && (
                        <span className="add-items__product-cat">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <button
                      className={`add-items__product-add-btn ${isProductSelected(product.id) ? "added" : ""}`}
                      onClick={() => addProductToSelection(product)}
                      disabled={isProductSelected(product.id)}
                    >
                      {isProductSelected(product.id)
                        ? "✓ Agregado"
                        : "+ Agregar"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Selected products with qty */}
            {selectedProducts.length > 0 && (
              <div className="add-items__selected">
                <span className="add-items__selected-title">
                  Productos seleccionados ({selectedProducts.length})
                </span>
                {selectedProducts.map((p) => (
                  <div key={p.id} className="add-items__selected-row">
                    <span className="add-items__selected-name">{p.name}</span>
                    <div className="add-items__selected-qty">
                      <label>Cant:</label>
                      <input
                        type="number"
                        min="1"
                        value={p.qty}
                        onChange={(e) =>
                          updateSelectedQty(p.id, parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <span className="add-items__selected-total">
                      ${(p.qty * p.rate).toLocaleString("es-AR")}
                    </span>
                    <button
                      className="row-delete-btn"
                      onClick={() => removeSelectedProduct(p.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="modal-footer-actions">
          <button className="btn-cancel" onClick={handleClose}>
            Cancelar
          </button>
          <button className="btn-submit" onClick={handleSubmit}>
            Agregar al presupuesto
          </button>
        </div>
      </div>
    </Modal>
  );
}
