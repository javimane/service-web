import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Upload,
  Link as LinkIcon,
  Barcode,
  Info,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { productService } from "../../../services/productService";
import { uploadProductImage } from "../../../services/storageUploads";
import "./DashboardProducts.css";

const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

type ProductItem = (typeof initialProducts)[number];

export default function DashboardProducts() {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();
  
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

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
    ean: "",
    webUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // Edit product modal
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<{
    id: number;
    title: string;
    price: string;
    category: string;
    stock: string;
    image: string;
    description: string;
    ean: string;
    webUrl: string;
  } | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  // Queries & Mutations
  const { data: productsData = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["professional-products", professionalId],
    queryFn: () => productService.getByProfessional(professionalId),
    enabled: !!professionalId,
  });

  // Map API data to component structure
  const productsList = useMemo(() => {
    return productsData.map((item: any) => ({
      id: item.product_id,
      title: item.product?.name || "Sin nombre",
      price: item.price,
      originalPrice: item.price, // Or some logic if you have discounts
      category: item.product?.CategoryProduct?.name || "General",
      stock: item.stock || 0,
      image: item.product?.image_url || "",
      description: item.product?.description || "",
      ean: item.product?.ean || "",
      sale_type: item.sale_type,
      is_active: item.is_active,
    }));
  }, [productsData]);

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: (newProduct) => {
      // After creating the product, assign it to the professional
      assignMutation.mutate({
        professional_id: professionalId,
        product_id: String(newProduct.id),
        price: Number(formPrice),
        sale_type: "unit",
        stock: Number(formStock),
        is_active: true,
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: productService.assignToProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      resetAddModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      productService.updateProfessionalProduct(professionalId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      resetEditModal();
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (productId: string) =>
      productService.unassignFromProfessional(productId, professionalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
    },
  });

  const massUpdateMutation = useMutation({
    mutationFn: productService.massUpdatePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setBulkApplied(true);
      setTimeout(() => {
        setBulkApplied(false);
        setBulkOpen(false);
        setBulkValue("");
      }, 1200);
    },
  });

  // Modal helper states for values not in the "newProduct" object
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  // EAN duplicate flow
  const [eanLoading, setEanLoading] = useState(false);
  const [eanMatch, setEanMatch] = useState<any>(null);
  const [eanPriceMode, setEanPriceMode] = useState<"same" | "custom">("same");
  const [eanCustomPrice, setEanCustomPrice] = useState("");

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

    massUpdateMutation.mutate({
      professionalId,
      type: bulkMode as any,
      value: val,
      operation: bulkAction === "increase" ? "add" : "subtract",
    });
  };

  // Image file handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  // EAN check against DB
  const handleCheckEan = async () => {
    const ean = newProduct.ean.trim();
    if (!ean) return;
    setEanLoading(true);
    setEanMatch(null);
    try {
      // Use the search by name/ean endpoint instead of fetching the whole list
      const matches = await productService.getByName(ean);
      const match = matches.find((p: any) => p.ean === ean);

      if (match) {
        setEanMatch({
          id: match.id,
          title: match.name,
          price: 0,
          image: match.image_url,
          category: match.CategoryProduct?.name,
        });
        setEanPriceMode("custom");
        setEanCustomPrice("");
      } else {
        // If no EAN match, maybe it's a new product
        setEanMatch(null);
      }
    } catch (error) {
      console.error("Error checking EAN:", error);
    }
    setEanLoading(false);
  };

  // Add existing product from EAN match
  const handleAddFromEan = () => {
    if (!eanMatch) return;
    const finalPrice = Number(eanCustomPrice) || 0;
    
    assignMutation.mutate({
      professional_id: professionalId,
      product_id: String(eanMatch.id),
      price: finalPrice,
      sale_type: "unit",
      is_active: true,
      stock: 0
    });
  };

  // Reset add modal state
  const resetAddModal = () => {
    setNewProduct({
      title: "",
      price: "",
      category: "",
      stock: "",
      image: "",
      description: "",
      ean: "",
      webUrl: "",
    });
    setFormPrice("");
    setFormStock("");
    setImageFile(null);
    setImagePreview("");
    setEanMatch(null);
    setEanLoading(false);
    setEanCustomPrice("");
    setAddOpen(false);
  };

  // Add product
  const handleAddProduct = async () => {
    if (!newProduct.title.trim() || !formPrice) return;

    let uploadedProductImageUrl = imagePreview || newProduct.image || "";
    if (imageFile) {
      const uploaded = await uploadProductImage({
        file: imageFile,
        entityId: newProduct.ean || newProduct.title,
        folder: "products",
        fileName: imageFile.name,
      });
      uploadedProductImageUrl = uploaded.publicUrl;
    }

    createMutation.mutate({
      ean: newProduct.ean,
      name: newProduct.title,
      description: newProduct.description,
      brand: "",
      image_url: uploadedProductImageUrl,
      categories_products_id: undefined // Backend should handle if null
    });
  };

  // Open edit modal
  const openEditModal = (product: any) => {
    setEditProduct({
      id: product.id,
      title: product.title,
      price: String(product.price),
      category: product.category || "",
      stock: String(product.stock || 0),
      image: product.image || "",
      description: product.description || "",
      ean: product.ean || "",
      webUrl: "",
    });
    setEditImagePreview(product.image || "");
    setEditImageFile(null);
    setEditOpen(true);
  };

  // Edit image handler
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview("");
    if (editProduct) {
      setEditProduct({ ...editProduct, image: "" });
    }
  };

  // Save edited product
  const handleEditProduct = async () => {
    if (!editProduct || !editProduct.title.trim() || !editProduct.price) return;

    updateMutation.mutate({
      productId: String(editProduct.id),
      data: {
        price: Number(editProduct.price),
        stock: Number(editProduct.stock),
      }
    });
  };

  const resetEditModal = () => {
    setEditProduct(null);
    setEditImageFile(null);
    setEditImagePreview("");
    setEditOpen(false);
  };

  // Delete product (Unassign)
  const handleDelete = (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres quitar este producto de tu catálogo?")) {
      unassignMutation.mutate(String(id));
    }
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
        {loadingProducts ? (
          <div className="dash-products__loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Cargando catálogo...</p>
          </div>
        ) : (
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
                        onClick={() => openEditModal(product)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="dash-products__action-btn dash-products__action-btn--danger"
                        aria-label="Quitar de mi lista"
                        title="Quitar de mi lista"
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
                    No se encontraron productos en tu catálogo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
        <div className="dash-products__overlay" onClick={resetAddModal}>
          <div
            className="dash-products__modal dash-products__modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-products__modal-header">
              <h2>Agregar Producto</h2>
              <button
                className="dash-products__modal-close"
                onClick={resetAddModal}
              >
                <X size={20} />
              </button>
            </div>

            {/* EAN field with check */}
            <div className="dash-products__modal-field dash-products__field--full">
              <label>Código EAN / UPC</label>
              <div className="dash-products__ean-row">
                <div
                  className="dash-products__modal-input-wrap"
                  style={{ flex: 1 }}
                >
                  <Barcode size={16} />
                  <input
                    type="text"
                    placeholder="Ej: 7790001234567"
                    value={newProduct.ean}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, ean: e.target.value })
                    }
                  />
                </div>
                <button
                  className="dash-products__ean-check-btn"
                  onClick={handleCheckEan}
                  disabled={!newProduct.ean.trim() || eanLoading}
                >
                  {eanLoading ? "Buscando..." : "Verificar"}
                </button>
              </div>
            </div>

            {/* EAN Match found */}
            {eanMatch && (
              <div className="dash-products__ean-match">
                <div className="dash-products__ean-match-header">
                  <Info size={16} />
                  <span>Este producto ya existe en nuestra base de datos</span>
                </div>
                <div className="dash-products__ean-match-card">
                  {eanMatch.image && (
                    <img
                      src={eanMatch.image}
                      alt=""
                      className="dash-products__ean-match-img"
                    />
                  )}
                  <div className="dash-products__ean-match-info">
                    <span className="dash-products__ean-match-name">
                      {eanMatch.title}
                    </span>
                    <span className="dash-products__ean-match-price">
                      {formatPrice(eanMatch.price)}
                    </span>
                    {eanMatch.category && (
                      <span className="dash-products__ean-match-cat">
                        {eanMatch.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dash-products__modal-field">
                  <label>¿A qué precio querés agregarlo?</label>
                  <div className="dash-products__modal-toggle">
                    <button
                      className={eanPriceMode === "same" ? "active" : ""}
                      onClick={() => setEanPriceMode("same")}
                    >
                      Mismo precio ({formatPrice(eanMatch.price)})
                    </button>
                    <button
                      className={eanPriceMode === "custom" ? "active" : ""}
                      onClick={() => setEanPriceMode("custom")}
                    >
                      Precio personalizado
                    </button>
                  </div>
                </div>

                {eanPriceMode === "custom" && (
                  <div className="dash-products__modal-field">
                    <label>Tu precio (ARS)</label>
                    <div className="dash-products__modal-input-wrap">
                      <DollarSign size={16} />
                      <input
                        type="number"
                        min="0"
                        placeholder="Ingresá tu precio"
                        value={eanCustomPrice}
                        onChange={(e) => setEanCustomPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="dash-products__modal-footer">
                  <button
                    className="dash-products__modal-cancel"
                    onClick={() => setEanMatch(null)}
                  >
                    Crear nuevo
                  </button>
                  <button
                    className="dash-products__modal-apply"
                    onClick={handleAddFromEan}
                    disabled={
                      eanPriceMode === "custom" &&
                      (!eanCustomPrice || parseInt(eanCustomPrice) <= 0)
                    }
                  >
                    Agregar a mi cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Regular form (hidden when EAN match is shown) */}
            {!eanMatch && (
              <>
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
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>

                  <div className="dash-products__modal-field">
                    <label>Categoría</label>
                    <input
                      type="text"
                      placeholder="Ej: Herramientas"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="dash-products__modal-field">
                    <label>Stock</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                  </div>

                  <div className="dash-products__modal-field">
                    <label>URL de página web</label>
                    <div className="dash-products__modal-input-wrap">
                      <LinkIcon size={16} />
                      <input
                        type="url"
                        placeholder="https://www.ejemplo.com/producto"
                        value={newProduct.webUrl}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            webUrl: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Image upload */}
                  <div className="dash-products__modal-field dash-products__field--full">
                    <label>Imagen del producto</label>
                    {imagePreview ? (
                      <div className="dash-products__image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          className="dash-products__image-remove"
                          onClick={removeImage}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="dash-products__image-upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                        <Upload size={20} />
                        <span>Subir imagen</span>
                        <span className="dash-products__image-upload-hint">
                          JPG, PNG o WebP (máx. 5MB)
                        </span>
                      </label>
                    )}
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
                    onClick={resetAddModal}
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Edit Product Modal ===== */}
      {editOpen && editProduct && (
        <div className="dash-products__overlay" onClick={resetEditModal}>
          <div
            className="dash-products__modal dash-products__modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-products__modal-header">
              <h2>Editar Producto</h2>
              <button
                className="dash-products__modal-close"
                onClick={resetEditModal}
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
                  value={editProduct.title}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, title: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Precio (ARS) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, price: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Categoría</label>
                <input
                  type="text"
                  placeholder="Ej: Herramientas"
                  value={editProduct.category}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      category: e.target.value,
                    })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editProduct.stock}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, stock: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Código EAN / UPC</label>
                <div className="dash-products__modal-input-wrap">
                  <Barcode size={16} />
                  <input
                    type="text"
                    placeholder="Ej: 7790001234567"
                    value={editProduct.ean}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, ean: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="dash-products__modal-field dash-products__field--full">
                <label>URL de página web</label>
                <div className="dash-products__modal-input-wrap">
                  <LinkIcon size={16} />
                  <input
                    type="url"
                    placeholder="https://www.ejemplo.com/producto"
                    value={editProduct.webUrl}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        webUrl: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Image upload */}
              <div className="dash-products__modal-field dash-products__field--full">
                <label>Imagen del producto</label>
                {editImagePreview ? (
                  <div className="dash-products__image-preview">
                    <img src={editImagePreview} alt="Preview" />
                    <button
                      className="dash-products__image-remove"
                      onClick={removeEditImage}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="dash-products__image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      hidden
                    />
                    <Upload size={20} />
                    <span>Subir imagen</span>
                    <span className="dash-products__image-upload-hint">
                      JPG, PNG o WebP (máx. 5MB)
                    </span>
                  </label>
                )}
              </div>

              <div className="dash-products__modal-field dash-products__field--full">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Descripción breve del producto..."
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="dash-products__modal-footer">
              <button
                className="dash-products__modal-cancel"
                onClick={resetEditModal}
              >
                Cancelar
              </button>
              <button
                className="dash-products__modal-apply"
                onClick={handleEditProduct}
                disabled={!editProduct.title.trim() || !editProduct.price}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
