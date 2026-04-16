import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Percent,
  DollarSign,
  Package,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from "lucide-react";
import { products as initialProducts } from "../../../data/products";
import "./DashboardProducts.css";

const formatPrice = (n) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

export default function DashboardProducts() {
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  // Bulk price modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("percent"); // "percent" | "fixed"
  const [bulkValue, setBulkValue] = useState("");
  const [bulkAction, setBulkAction] = useState("increase"); // "increase" | "decrease"
  const [bulkApplied, setBulkApplied] = useState(false);

  // Add product modal
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
    image: "",
    description: "",
  });

  // Sorting
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const filtered = useMemo(() => {
    let list = productsList.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [productsList, searchQuery, sortField, sortDir]);

  // Stats
  const totalProducts = productsList.length;
  const totalStock = productsList.reduce((s, p) => s + (p.stock || 0), 0);
  const avgPrice =
    productsList.length > 0
      ? productsList.reduce((s, p) => s + p.price, 0) / productsList.length
      : 0;

  // Bulk price apply
  const handleBulkApply = () => {
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val <= 0) return;

    setProductsList((prev) =>
      prev.map((p) => {
        let newPrice = p.price;
        if (bulkMode === "percent") {
          const delta = p.price * (val / 100);
          newPrice =
            bulkAction === "increase" ? p.price + delta : p.price - delta;
        } else {
          newPrice = bulkAction === "increase" ? p.price + val : p.price - val;
        }
        return { ...p, price: Math.max(0, Math.round(newPrice)) };
      }),
    );
    setBulkApplied(true);
    setTimeout(() => {
      setBulkApplied(false);
      setBulkOpen(false);
      setBulkValue("");
    }, 1200);
  };

  // Add product
  const handleAddProduct = () => {
    if (!newProduct.title.trim() || !newProduct.price) return;
    const id = Math.max(...productsList.map((p) => p.id), 0) + 1;
    setProductsList((prev) => [
      ...prev,
      {
        id,
        title: newProduct.title,
        price: parseInt(newProduct.price, 10) || 0,
        originalPrice: parseInt(newProduct.price, 10) || 0,
        discount: 0,
        rating: 0,
        reviews: 0,
        freeShipping: false,
        seller: "Mi Tienda",
        category: newProduct.category || "General",
        condition: "Nuevo",
        stock: parseInt(newProduct.stock, 10) || 0,
        image: newProduct.image || "",
        description: newProduct.description || "",
        features: [],
      },
    ]);
    setNewProduct({
      title: "",
      price: "",
      category: "",
      stock: "",
      image: "",
      description: "",
    });
    setAddOpen(false);
  };

  // Delete product
  const handleDelete = (id) => {
    setProductsList((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="dash-products">
      {/* Header */}
      <div className="dash-products__header">
        <div>
          <span className="dash-products__label">GESTIÓN</span>
          <h1 className="dash-products__title">Productos</h1>
        </div>
        <button
          className="dash-products__add-btn"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={18} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="dash-products__stats">
        <div className="dash-products__stat">
          <Package size={18} />
          <div>
            <span className="dash-products__stat-value">{totalProducts}</span>
            <span className="dash-products__stat-label">Productos</span>
          </div>
        </div>
        <div className="dash-products__stat">
          <DollarSign size={18} />
          <div>
            <span className="dash-products__stat-value">
              {formatPrice(avgPrice)}
            </span>
            <span className="dash-products__stat-label">Precio Promedio</span>
          </div>
        </div>
        <div className="dash-products__stat">
          <Package size={18} />
          <div>
            <span className="dash-products__stat-value">{totalStock}</span>
            <span className="dash-products__stat-label">Stock Total</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dash-products__toolbar">
        <div className="dash-products__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="dash-products__bulk-btn"
          onClick={() => setBulkOpen(true)}
        >
          <Percent size={16} />
          <span>Modificar Precios</span>
        </button>
      </div>

      {/* Product list table */}
      <div className="dash-products__table-wrap">
        <table className="dash-products__table">
          <thead>
            <tr>
              <th className="dash-products__th-img"></th>
              <th
                onClick={() => toggleSort("title")}
                className="dash-products__th-sort"
              >
                Producto <SortIcon field="title" />
              </th>
              <th
                onClick={() => toggleSort("category")}
                className="dash-products__th-sort"
              >
                Categoría <SortIcon field="category" />
              </th>
              <th
                onClick={() => toggleSort("price")}
                className="dash-products__th-sort dash-products__th-right"
              >
                Precio <SortIcon field="price" />
              </th>
              <th
                onClick={() => toggleSort("stock")}
                className="dash-products__th-sort dash-products__th-right"
              >
                Stock <SortIcon field="stock" />
              </th>
              <th className="dash-products__th-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="dash-products__row">
                <td className="dash-products__cell-img">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="dash-products__thumb"
                    />
                  ) : (
                    <div className="dash-products__thumb-placeholder">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </td>
                <td>
                  <span className="dash-products__product-name">
                    {product.title}
                  </span>
                  {product.seller && (
                    <span className="dash-products__product-seller">
                      {product.seller}
                    </span>
                  )}
                </td>
                <td>
                  <span className="dash-products__badge">
                    {product.category}
                  </span>
                </td>
                <td className="dash-products__cell-right">
                  <span className="dash-products__price">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="dash-products__price-original">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </td>
                <td className="dash-products__cell-right">
                  <span
                    className={`dash-products__stock ${product.stock <= 10 ? "dash-products__stock--low" : ""}`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="dash-products__cell-right">
                  <div className="dash-products__actions">
                    <button
                      className="dash-products__action-btn"
                      aria-label="Editar"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="dash-products__action-btn dash-products__action-btn--danger"
                      aria-label="Eliminar"
                      title="Eliminar"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="dash-products__empty">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Bulk Price Modal ===== */}
      {bulkOpen && (
        <div
          className="dash-products__overlay"
          onClick={() => setBulkOpen(false)}
        >
          <div
            className="dash-products__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-products__modal-header">
              <h2>Modificar Precios</h2>
              <button
                className="dash-products__modal-close"
                onClick={() => setBulkOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="dash-products__modal-desc">
              Aplica un ajuste de precio a <strong>todos los productos</strong>{" "}
              de tu catálogo.
            </p>

            {/* Action select */}
            <div className="dash-products__modal-field">
              <label>Tipo de ajuste</label>
              <div className="dash-products__modal-toggle">
                <button
                  className={bulkAction === "increase" ? "active" : ""}
                  onClick={() => setBulkAction("increase")}
                >
                  Aumentar
                </button>
                <button
                  className={bulkAction === "decrease" ? "active" : ""}
                  onClick={() => setBulkAction("decrease")}
                >
                  Disminuir
                </button>
              </div>
            </div>

            {/* Mode select */}
            <div className="dash-products__modal-field">
              <label>Aplicar por</label>
              <div className="dash-products__modal-toggle">
                <button
                  className={bulkMode === "percent" ? "active" : ""}
                  onClick={() => setBulkMode("percent")}
                >
                  <Percent size={14} />
                  Porcentaje
                </button>
                <button
                  className={bulkMode === "fixed" ? "active" : ""}
                  onClick={() => setBulkMode("fixed")}
                >
                  <DollarSign size={14} />
                  Monto Fijo
                </button>
              </div>
            </div>

            {/* Value input */}
            <div className="dash-products__modal-field">
              <label>
                {bulkMode === "percent" ? "Porcentaje (%)" : "Monto (ARS)"}
              </label>
              <div className="dash-products__modal-input-wrap">
                {bulkMode === "percent" ? (
                  <Percent size={16} />
                ) : (
                  <DollarSign size={16} />
                )}
                <input
                  type="number"
                  min="0"
                  step={bulkMode === "percent" ? "1" : "100"}
                  placeholder={bulkMode === "percent" ? "Ej: 10" : "Ej: 5000"}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            {bulkValue && parseFloat(bulkValue) > 0 && (
              <div className="dash-products__modal-preview">
                <AlertTriangle size={14} />
                <span>
                  Esto {bulkAction === "increase" ? "aumentará" : "disminuirá"}{" "}
                  el precio de <strong>{productsList.length} productos</strong>{" "}
                  {bulkMode === "percent"
                    ? `en un ${bulkValue}%`
                    : `en ${formatPrice(parseFloat(bulkValue))}`}
                </span>
              </div>
            )}

            <button
              className={`dash-products__modal-apply ${bulkApplied ? "dash-products__modal-apply--done" : ""}`}
              onClick={handleBulkApply}
              disabled={!bulkValue || parseFloat(bulkValue) <= 0 || bulkApplied}
            >
              {bulkApplied ? (
                <>
                  <Check size={18} /> Aplicado
                </>
              ) : (
                "Aplicar Cambios"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== Add Product Modal ===== */}
      {addOpen && (
        <div
          className="dash-products__overlay"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="dash-products__modal dash-products__modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-products__modal-header">
              <h2>Agregar Producto</h2>
              <button
                className="dash-products__modal-close"
                onClick={() => setAddOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dash-products__form-grid">
              <div className="dash-products__modal-field dash-products__field--full">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Taladro Bosch 550W"
                  value={newProduct.title}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, title: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Precio (ARS) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Categoría</label>
                <input
                  type="text"
                  placeholder="Ej: Herramientas"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>URL de imagen</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProduct.image}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field dash-products__field--full">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Descripción breve del producto..."
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="dash-products__modal-footer">
              <button
                className="dash-products__modal-cancel"
                onClick={() => setAddOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="dash-products__modal-apply"
                onClick={handleAddProduct}
                disabled={!newProduct.title.trim() || !newProduct.price}
              >
                Agregar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
