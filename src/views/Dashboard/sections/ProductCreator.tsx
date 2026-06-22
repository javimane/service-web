"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Check,
  AlertTriangle,
  Upload,
  X,
  Camera,
  Barcode,
  Loader2,
  ArrowLeft,
  Package,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  createProductAction,
  getProductByEanAction,
  assignProductToProfessionalAction,
} from "../../../app/actions/products";
import { getProductCategoriesAction } from "../../../app/actions/categories";
import { getAccessToken } from "../../../utils/auth";
import { uploadProductImage } from "../../../services/storageUploads";
import BarcodeScanner from "../../../components/BarcodeScanner/BarcodeScanner";
import "./DashboardProducts.css";
import "./ProductCreator.css";

const MAX_PRODUCT_IMAGES = 4;

const moveArrayItem = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

interface ProductCreatorProps {
  onBack: () => void;
}

export default function ProductCreator({ onBack }: ProductCreatorProps) {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    categoryId: "",
    description: "",
    ean: "",
    offerPrice: "",
    currency_code: "ARG",
    percent_discount: "",
    link_url: "",
    wholesale: false,
    wholesale_price: "",
    wholesale_unit: "",
    image: "",
  });

  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggingNewImageIndex, setDraggingNewImageIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [eanLoading, setEanLoading] = useState(false);
  const [eanMatch, setEanMatch] = useState<any>(null);
  const [eanCustomPrice, setEanCustomPrice] = useState("");
  const [eanStock, setEanStock] = useState("");
  const [eanOfferPrice, setEanOfferPrice] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-products"],
    queryFn: async () => {
      const result = await getProductCategoriesAction();
      return result?.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const result = await createProductAction({ ...data, ...(token ? { token } : {}) });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setShowSuccessModal(true);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const result = await assignProductToProfessionalAction({ ...data, ...(token ? { token } : {}) });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setShowSuccessModal(true);
    },
  });

  const isSaving = createMutation.isPending || assignMutation.isPending;

  /* ── Image handlers ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    const slots = MAX_PRODUCT_IMAGES - imageFiles.length;
    if (slots <= 0) return;
    const toAdd = incoming.slice(0, slots);
    setImageFiles((p) => [...p, ...toAdd]);
    Promise.all(
      toAdd.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onloadend = () => res((r.result as string) || "");
            r.readAsDataURL(f);
          }),
      ),
    ).then((results) => setImagePreviews((p) => [...p, ...results.filter(Boolean)]));
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleNewImageDrop = (target: number) => {
    if (draggingNewImageIndex === null || draggingNewImageIndex === target) return;
    setImageFiles((p) => moveArrayItem(p, draggingNewImageIndex, target));
    setImagePreviews((p) => moveArrayItem(p, draggingNewImageIndex, target));
    setDraggingNewImageIndex(null);
  };

  /* ── EAN check ── */
  const handleCheckEan = async () => {
    const ean = newProduct.ean.trim();
    if (!ean) return;
    setEanLoading(true);
    setEanMatch(null);
    try {
      const result = await getProductByEanAction({ ean, professionalId });
      const match = result?.data ?? null;
      if (match) {
        setEanMatch({
          id: match.Product?.id || match.product_id,
          title: match.Product?.name || "Sin nombre",
          image: match.Product?.image_url || "",
          category: match.Product?.CategoryProduct?.name || (match.Product as any)?.category?.name || "General",
          isAlreadyAssigned: (match as any).is_already_assigned,
        });
        setEanCustomPrice("");
        setEanStock("");
        setEanOfferPrice("");
      }
    } catch (err) {
      console.error("Error checking EAN:", err);
    }
    setEanLoading(false);
  };

  const handleAddFromEan = () => {
    if (!eanMatch) return;
    assignMutation.mutate({
      professional_id: professionalId,
      product_id: String(eanMatch.id),
      price: Number(eanCustomPrice) || 0,
      sale_type: "unit",
      is_active: true,
      stock: Number(eanStock) || 0,
      offer_price: Number(eanOfferPrice) || 0,
    });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!newProduct.name.trim()) e.name = "El nombre es obligatorio.";
    if (!newProduct.ean.trim()) e.ean = "El EAN es obligatorio.";
    if (!formPrice) e.price = "El precio es obligatorio.";
    if (!newProduct.categoryId) e.categoryId = "La categoría es obligatoria.";
    if (!formStock) e.stock = "El stock es obligatorio.";
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});

    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const up = await uploadProductImage({ file, entityId: newProduct.name });
      uploadedUrls.push(up.publicUrl);
    }
    const images = uploadedUrls.length > 0 ? uploadedUrls : newProduct.image ? [newProduct.image] : [];

    createMutation.mutate({
      ean: newProduct.ean,
      name: newProduct.name,
      description: newProduct.description,
      brand: newProduct.brand,
      image_url: images,
      display_order: images.map((_, i) => i + 1),
      categories_products_id: newProduct.categoryId ? Number(newProduct.categoryId) : undefined,
      professional_id: professionalId,
      price: Number(formPrice),
      sale_type: "unit",
      stock: Number(formStock),
      is_active: true,
      offer_price: Number(newProduct.offerPrice) || 0,
      currency_code: newProduct.currency_code || "ARG",
      percent_discount: Number(newProduct.percent_discount) || 0,
      link_url: newProduct.link_url.trim() || undefined,
      wholesale: newProduct.wholesale,
      wholesale_price: Number(newProduct.wholesale_price) || 0,
      wholesale_unit: Number(newProduct.wholesale_unit) || 0,
    });
  };

  const set = (key: string, val: string | boolean) =>
    setNewProduct((p) => ({ ...p, [key]: val }));

  return (
    <div className="product-creator">
      {/* ── Header ── */}
      <div className="product-creator__header">
        <button className="product-creator__back-btn" onClick={onBack} title="Volver">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="product-creator__title">Agregar Producto</h1>
          <p className="product-creator__subtitle">
            Completá los datos o escanea el código EAN para asociar un producto existente.
          </p>
        </div>
      </div>

      {/* ── Sección 1: Identificación EAN ── */}
      <div className="product-creator__body">
      <div className="product-creator__section">
        <p className="product-creator__section-title">
          <Barcode size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Código de barras (EAN)
        </p>

        <div className="product-creator__field">
          <label>EAN *</label>
          <span className="product-creator__images-hint" style={{ marginTop: 0 }}>
            Probá tu lector de código de barras físico haciendo clic en el campo.
          </span>
          <div className="product-creator__ean-row">
            <div className="product-creator__ean-input-wrap">
              <Barcode size={16} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Escanea o escribe el código..."
                value={newProduct.ean}
                onChange={(e) => set("ean", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCheckEan(); } }}
              />
              <button
                type="button"
                className="product-creator__scan-btn"
                onClick={() => setIsScannerOpen(true)}
                title="Escanear con cámara"
              >
                <Camera size={16} />
              </button>
            </div>
            <button
              type="button"
              className="product-creator__verify-btn"
              onClick={handleCheckEan}
              disabled={!newProduct.ean.trim() || eanLoading}
            >
              {eanLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Verificar
            </button>
          </div>
          {errors.ean && <span className="product-creator__error">{errors.ean}</span>}
        </div>

        {/* EAN Match result */}
        {eanMatch && (
          <div className="product-creator__ean-match">
            <span className={`product-creator__ean-badge product-creator__ean-badge--${eanMatch.isAlreadyAssigned ? "error" : "success"}`}>
              {eanMatch.isAlreadyAssigned ? <AlertTriangle size={14} /> : <Check size={14} />}
              {eanMatch.isAlreadyAssigned ? "Ya tenés este producto" : "Producto encontrado en la base general"}
            </span>

            <div className="product-creator__ean-product">
              {eanMatch.image && (
                <img src={eanMatch.image} alt={eanMatch.title} className="product-creator__ean-img" />
              )}
              <div>
                <p className="product-creator__ean-product-title">{eanMatch.title}</p>
                <span className="product-creator__ean-product-cat">{eanMatch.category}</span>
              </div>
            </div>

            {!eanMatch.isAlreadyAssigned && (
              <div className="product-creator__grid" style={{ marginTop: 0 }}>
                <div className="product-creator__field">
                  <label>Tu precio final *</label>
                  <input type="number" min="0" placeholder="Ej: 1500" value={eanCustomPrice} onChange={(e) => setEanCustomPrice(e.target.value)} />
                </div>
                <div className="product-creator__field">
                  <label>Precio de oferta</label>
                  <input type="number" min="0" placeholder="Ej: 1300" value={eanOfferPrice} onChange={(e) => setEanOfferPrice(e.target.value)} />
                </div>
                <div className="product-creator__field">
                  <label>Stock inicial *</label>
                  <input type="number" min="0" placeholder="Ej: 10" value={eanStock} onChange={(e) => setEanStock(e.target.value)} />
                </div>
              </div>
            )}

            <div className="product-creator__ean-actions">
              <button className="product-creator__btn-cancel" onClick={() => setEanMatch(null)}>
                {eanMatch.isAlreadyAssigned ? "Cerrar" : "Crear uno nuevo"}
              </button>
              {!eanMatch.isAlreadyAssigned && (
                <button
                  className="product-creator__btn-save"
                  onClick={handleAddFromEan}
                  disabled={!eanCustomPrice || parseInt(eanCustomPrice) <= 0 || !eanStock || isSaving}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Agregar a mi catálogo
                </button>
              )}
            </div>
          </div>
        )}

        {isScannerOpen && (
          <BarcodeScanner
            onScan={(text) => { set("ean", text); setIsScannerOpen(false); }}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
      </div>

      {/* ── Sección 2: Datos del producto ── */}
      {!eanMatch && (
        <>
          <div className="product-creator__section">
            <p className="product-creator__section-title">
              <Package size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Información del producto
            </p>

            <div className="product-creator__grid">
              <div className="product-creator__field product-creator__field--full">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Taladro Bosch 550W"
                  value={newProduct.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                {errors.name && <span className="product-creator__error">{errors.name}</span>}
              </div>

              <div className="product-creator__field">
                <label>Marca</label>
                <input type="text" placeholder="Ej: Bosch, Samsung..." value={newProduct.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>

              <div className="product-creator__field">
                <label>Categoría *</label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className="dash-products__modal-select"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <span className="product-creator__error">{errors.categoryId}</span>}
              </div>

              <div className="product-creator__field product-creator__field--full">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Describí las características del producto..."
                  value={newProduct.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <div className="product-creator__field product-creator__field--full">
                <label>Enlace del producto (Opcional)</label>
                <input
                  type="url"
                  placeholder="Ej: https://mi-sitio.com/producto"
                  value={newProduct.link_url}
                  onChange={(e) => set("link_url", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Sección 3: Precios ── */}
          <div className="product-creator__section">
            <p className="product-creator__section-title">
              <Tag size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Precios y stock
            </p>

            <div className="product-creator__grid">
              <div className="product-creator__field">
                <label>Precio *</label>
                <input type="number" min="0" placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                {errors.price && <span className="product-creator__error">{errors.price}</span>}
              </div>

              <div className="product-creator__field">
                <label>Precio de Oferta</label>
                <input type="number" min="0" placeholder="0" value={newProduct.offerPrice} onChange={(e) => set("offerPrice", e.target.value)} />
              </div>

              <div className="product-creator__field">
                <label>Descuento (%)</label>
                <input type="number" min="0" max="100" placeholder="Ej: 10" value={newProduct.percent_discount} onChange={(e) => set("percent_discount", e.target.value)} />
              </div>

              <div className="product-creator__field">
                <label>Stock *</label>
                <input type="number" min="0" placeholder="0" value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                {errors.stock && <span className="product-creator__error">{errors.stock}</span>}
              </div>

              <div className="product-creator__field">
                <label>Moneda</label>
                <select
                  value={newProduct.currency_code}
                  onChange={(e) => set("currency_code", e.target.value)}
                  className="dash-products__modal-select"
                >
                  <option value="ARG">Pesos ($)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              {/* Wholesale */}
              <label className="product-creator__wholesale-row">
                <input
                  type="checkbox"
                  checked={newProduct.wholesale}
                  onChange={(e) => set("wholesale", e.target.checked)}
                />
                <span>Habilitar venta por mayor</span>
              </label>

              {newProduct.wholesale && (
                <>
                  <div className="product-creator__field">
                    <label>Precio por mayor</label>
                    <input type="number" min="0" placeholder="Ej: 1000" value={newProduct.wholesale_price} onChange={(e) => set("wholesale_price", e.target.value)} />
                  </div>
                  <div className="product-creator__field">
                    <label>Unidad mínima de compra</label>
                    <input type="number" min="1" placeholder="Ej: 10" value={newProduct.wholesale_unit} onChange={(e) => set("wholesale_unit", e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Sección 4: Imágenes ── */}
          <div className="product-creator__section">
            <p className="product-creator__section-title">
              <ImageIcon size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Imágenes ({imageFiles.length}/{MAX_PRODUCT_IMAGES})
            </p>

            <div className="dash-products__images-grid">
              {imagePreviews.map((preview, idx) => (
                <div
                  key={`preview-${idx}`}
                  className="dash-products__image-item"
                  draggable
                  onDragStart={(e) => { setDraggingNewImageIndex(idx); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => { e.preventDefault(); handleNewImageDrop(idx); }}
                >
                  <img src={preview} alt={`Preview ${idx + 1}`} />
                  <button type="button" className="dash-products__image-remove" onClick={() => removeImage(idx)}>
                    <X size={14} />
                  </button>
                  {idx === 0 && <div className="dash-products__image-main-badge">Principal</div>}
                </div>
              ))}

              {imageFiles.length < MAX_PRODUCT_IMAGES && (
                <label className="dash-products__image-upload">
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} disabled={isSaving} />
                  <Upload size={24} className="icon-blue" />
                  <span>Subir foto</span>
                </label>
              )}
            </div>
            <p className="product-creator__images-hint">
              Hasta {MAX_PRODUCT_IMAGES} imágenes. Arrastrá para reordenar. La primera es la imagen principal.
            </p>
          </div>

          {/* ── Footer ── */}
          <div className="product-creator__footer">
            <button type="button" className="product-creator__btn-cancel" onClick={onBack} disabled={isSaving}>
              Cancelar
            </button>
            <button type="button" className="product-creator__btn-save" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              ) : (
                <><Check size={16} /> Guardar Producto</>
              )}
            </button>
          </div>
        </>
      )}

      </div>{/* end product-creator__body */}

      {/* ── Modal de éxito ── */}
      {showSuccessModal && (
        <div className="dash-products__modal-overlay">
          <div className="dash-products__modal dash-products__modal--small dash-products__modal--success">
            <div className="modal-success-icon">
              <Check size={32} />
            </div>
            <h3>¡Producto guardado!</h3>
            <p>El producto se agregó correctamente a tu catálogo.</p>
            <button className="dash-products__modal-apply" onClick={() => { setShowSuccessModal(false); onBack(); }}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
