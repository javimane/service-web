"use client";
import { useState, useEffect } from "react";
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
import { getProductCategoriesAction } from "../../../app/actions/categories";
import { getAccessToken } from "../../../utils/auth";
import { uploadProductImage } from "../../../services/storageUploads";
import BarcodeScanner from "../../../components/BarcodeScanner/BarcodeScanner";
import { cropImageToSquare } from "../../../utils/imageUtils";
import "./DashboardProducts.css";
import "./ProductCreator.css";
import {
  assignProductToProfessionalAction,
  createProductAction,
  getProductByEanAction,
  updateProfessionalProductAction,
  updateProductAction,
} from "@/app/actions/products";

const MAX_PRODUCT_IMAGES = 10;

const moveArrayItem = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

interface ProductCreatorProps {
  onBack: () => void;
  productToEdit?: any;
}

export default function ProductCreator({
  onBack,
  productToEdit,
}: ProductCreatorProps) {
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
    has_ean: false,
    weight: "",
    width: "",
    height: "",
    depth: "",
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
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggingNewImageIndex, setDraggingNewImageIndex] = useState<
    number | null
  >(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [eanLoading, setEanLoading] = useState(false);
  const [eanMatch, setEanMatch] = useState<any>(null);
  const [eanCheckedAndFree, setEanCheckedAndFree] = useState(false);
  const [eanCustomPrice, setEanCustomPrice] = useState("");
  const [eanStock, setEanStock] = useState("");
  const [eanOfferPrice, setEanOfferPrice] = useState("");
  const [eanCurrencyCode, setEanCurrencyCode] = useState("ARG");
  const [eanLinkUrl, setEanLinkUrl] = useState("");
  const [eanPercentDiscount, setEanPercentDiscount] = useState("");
  const [eanWholesale, setEanWholesale] = useState(false);
  const [eanWholesalePrice, setEanWholesalePrice] = useState("");
  const [eanWholesaleUnit, setEanWholesaleUnit] = useState("");

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
      const result = await createProductAction({
        ...data,
        ...(token ? { token } : {}),
      });
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
      const result = await assignProductToProfessionalAction({
        ...data,
        ...(token ? { token } : {}),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setShowSuccessModal(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const result = await updateProfessionalProductAction({
        ...data,
        ...(token ? { token } : {}),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setShowSuccessModal(true);
    },
  });

  const updateBaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const result = await updateProductAction({
        ...data,
        ...(token ? { token } : {}),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaving =
    isSubmitting ||
    createMutation.isPending ||
    assignMutation.isPending ||
    updateMutation.isPending ||
    updateBaseMutation.isPending;

  useEffect(() => {
    if (productToEdit) {
      setNewProduct((prev) => ({
        ...prev,
        name: productToEdit.name || "",
        brand: productToEdit.brand || "",
        categoryId:
          categories
            .find((c: any) => c.name === productToEdit.category)
            ?.id?.toString() || "",
        description: productToEdit.description || "",
        ean: productToEdit.ean || "",
        has_ean: !productToEdit.ean,
        weight: productToEdit.weight ? String(productToEdit.weight) : "",
        width: productToEdit.width ? String(productToEdit.width) : "",
        height: productToEdit.height ? String(productToEdit.height) : "",
        depth: productToEdit.depth ? String(productToEdit.depth) : "",
        offerPrice: productToEdit.offer_price
          ? String(productToEdit.offer_price)
          : "",
        currency_code: productToEdit.currency_code || "ARG",
        percent_discount: productToEdit.percent_discount
          ? String(productToEdit.percent_discount)
          : "",
        link_url: productToEdit.link_url || "",
        wholesale: productToEdit.wholesale || false,
        wholesale_price: productToEdit.wholesale_price
          ? String(productToEdit.wholesale_price)
          : "",
        wholesale_unit: productToEdit.wholesale_unit
          ? String(productToEdit.wholesale_unit)
          : "",
        image: productToEdit.image || "",
      }));
      setFormPrice(
        productToEdit.price !== undefined ? String(productToEdit.price) : "",
      );
      setFormStock(
        productToEdit.stock !== undefined ? String(productToEdit.stock) : "",
      );

      let imgs: string[] = [];
      if (
        Array.isArray(productToEdit.images) &&
        productToEdit.images.length > 0
      ) {
        imgs = productToEdit.images;
      } else if (productToEdit.image) {
        imgs = [productToEdit.image];
      } else if (typeof productToEdit.image_url === "string") {
        imgs = [productToEdit.image_url];
      }
      setImagePreviews(imgs);
      setImageFiles(imgs.map(() => null));
    }
  }, [productToEdit, categories]);

  /* ── Image handlers ── */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    const slots = MAX_PRODUCT_IMAGES - imagePreviews.length;
    if (slots <= 0) return;
    const toAdd = incoming.slice(0, slots);

    const croppedFiles = await Promise.all(
      toAdd.map((file) => cropImageToSquare(file).catch(() => file)),
    );

    setImageFiles((p) => [...p, ...croppedFiles]);
    Promise.all(
      croppedFiles.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onloadend = () => res((r.result as string) || "");
            r.readAsDataURL(f);
          }),
      ),
    ).then((results) =>
      setImagePreviews((p) => [...p, ...results.filter(Boolean)]),
    );
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleNewImageDrop = (target: number) => {
    if (draggingNewImageIndex === null || draggingNewImageIndex === target)
      return;
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
    setEanCheckedAndFree(false);
    try {
      const result = await getProductByEanAction({ ean, professionalId });
      const match = result?.data ?? null;
      if (match) {
        setEanMatch({
          id: match.id,
          title: match.name || "Sin nombre",
          image: match.Images?.[0]?.image_url || "",
          ean: match.ean,
          isAlreadyAssigned: (match as any).is_already_assigned,
        });
        setEanCustomPrice("");
        setEanStock("");
        setEanOfferPrice("");
        setEanCurrencyCode("ARG");
        setEanLinkUrl("");
        setEanPercentDiscount("");
        setEanWholesale(false);
        setEanWholesalePrice("");
        setEanWholesaleUnit("");
      } else {
        setEanCheckedAndFree(true);
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
      currency_code: eanCurrencyCode || "ARG",
      link_url: eanLinkUrl.trim() || null,
      percent_discount: Number(eanPercentDiscount) || 0,
      wholesale: eanWholesale,
      wholesale_unit: eanWholesale ? Number(eanWholesaleUnit) || 0 : undefined,
      wholesale_price: eanWholesale
        ? Number(eanWholesalePrice) || 0
        : undefined,
    });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const e: Record<string, string> = {};
      if (!newProduct.name.trim()) e.name = "El nombre es obligatorio.";
      if (!newProduct.has_ean && !newProduct.ean.trim())
        e.ean =
          "El EAN es obligatorio si no marcas la opción 'No tiene código de barra'.";
      if (!formPrice) e.price = "El precio es obligatorio.";
      if (!newProduct.categoryId) e.categoryId = "La categoría es obligatoria.";
      if (!formStock) e.stock = "El stock es obligatorio.";
      if (!newProduct.weight.trim()) e.weight = "El peso es obligatorio.";
      if (!newProduct.width.trim()) e.width = "El ancho es obligatorio.";
      if (!newProduct.height.trim()) e.height = "El alto es obligatorio.";
      if (!newProduct.depth.trim()) e.depth = "La profundidad es obligatoria.";

      if (Object.keys(e).length > 0) {
        setErrors(e);
        setIsSubmitting(false);
        return;
      }
      setErrors({});

      const images_url: string[] = [];
      const images_to_save: string[] = [];
      const images: string[] = [];

      for (let i = 0; i < imagePreviews.length; i++) {
        const file = imageFiles[i];
        if (file) {
          const up = await uploadProductImage({
            file,
            entityId: newProduct.name,
          });
          images_to_save.push(up.publicUrl);
          images.push(up.publicUrl);
        } else {
          images_url.push(imagePreviews[i]);
          images.push(imagePreviews[i]);
        }
      }

      const payload = {
        ean: newProduct.has_ean ? undefined : newProduct.ean,
        has_ean: newProduct.has_ean,
        weight: Number(newProduct.weight),
        width: Number(newProduct.width),
        height: Number(newProduct.height),
        depth: Number(newProduct.depth),
        name: newProduct.name,
        description: newProduct.description,
        brand: newProduct.brand,
        image_url: images,
        display_order: images.map((_, i) => i + 1),
        categories_products_id: newProduct.categoryId
          ? Number(newProduct.categoryId)
          : undefined,
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
      };

      if (productToEdit) {
        const productId = productToEdit.id || productToEdit.product_id;

        const originalUrls = productToEdit.images || [];
        const images_to_delete = originalUrls.filter(
          (url: string) => !payload.image_url.includes(url),
        );

        // 1. Update the base product
        await updateBaseMutation.mutateAsync({
          id: productId,
          ean: payload.ean,
          name: payload.name,
          description: payload.description,
          brand: payload.brand,
          categories_products_id: payload.categories_products_id,
          weight: payload.weight,
          width: payload.width,
          has_ean: payload.has_ean,
          height: payload.height,
          depth: payload.depth,
          images_url: images_url,
          images_to_save: images_to_save,
          images_to_delete: images_to_delete,
          display_order: payload.display_order,
        });

        // 2. Update the professional product relationship
        updateMutation.mutate({
          professionalId,
          productId,
          updates: {
            price: payload.price,
            sale_type: payload.sale_type,
            stock: payload.stock,
            is_active: payload.is_active,
            offer_price: payload.offer_price,
            currency_code: payload.currency_code,
            percent_discount: payload.percent_discount,
            link_url: payload.link_url,
            wholesale: payload.wholesale,
            wholesale_price: payload.wholesale_price,
            wholesale_unit: payload.wholesale_unit,
          },
        });
      } else {
        createMutation.mutate({
          ...payload,
          image_url: payload.image_url[0] || "",
          images_url: payload.image_url,
          images_to_save: payload.image_url,
        });
      }
    } catch (err) {
      console.error("Error submitting product:", err);
      // Wait, is there a visual way to alert? We'll just rethrow or set errors.
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (key: string, val: string | boolean) =>
    setNewProduct((p) => ({ ...p, [key]: val }));

  return (
    <div className="product-creator">
      {/* ── Header ── */}
      <div className="product-creator__header">
        <button
          className="product-creator__back-btn"
          onClick={onBack}
          title="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="product-creator__title">
            {productToEdit ? "Modificar Producto" : "Agregar Producto"}
          </h1>
          <p className="product-creator__subtitle">
            {productToEdit
              ? "Modificá los datos de tu producto."
              : "Completá los datos o escanea el código EAN para asociar un producto existente."}
          </p>
        </div>
      </div>

      {/* ── Sección 1: Identificación EAN ── */}
      <div className="product-creator__body">
        <div className="product-creator__section">
          <p className="product-creator__section-title">
            <Barcode
              size={13}
              style={{
                display: "inline",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Código de barras (EAN)
          </p>

          <div className="product-creator__field">
            <label>EAN *</label>
            <span
              className="product-creator__images-hint"
              style={{ marginTop: 0 }}
            >
              Probá tu lector de código de barras físico haciendo clic en el
              campo.
            </span>
            <div className="product-creator__ean-row">
              <div className="product-creator__ean-input-wrap">
                <Barcode
                  size={16}
                  style={{ color: "var(--accent-color)", flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder="Escanea o escribe el código..."
                  value={newProduct.has_ean ? "" : newProduct.ean}
                  onChange={(e) => {
                    set("ean", e.target.value);
                    setEanCheckedAndFree(false);
                    setEanMatch(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !newProduct.has_ean) {
                      e.preventDefault();
                      handleCheckEan();
                    }
                  }}
                  disabled={newProduct.has_ean}
                  style={newProduct.has_ean ? { opacity: 0.6 } : undefined}
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
                {eanLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                Verificar
              </button>
              {eanCheckedAndFree && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--success-color)",
                    background: "rgba(64, 192, 87, 0.1)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    fontWeight: "var(--weight-bold)",
                  }}
                >
                  <Check size={16} /> EAN libre
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                id="no-ean"
                checked={newProduct.has_ean}
                onChange={(e) => set("has_ean", e.target.checked)}
                disabled={!!(productToEdit && productToEdit.ean)}
                style={{ width: "auto", margin: 0, flexShrink: 0 }}
              />
              <label
                htmlFor="no-ean"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  margin: 0,
                  fontWeight: "var(--weight-normal)",
                }}
              >
                No tiene código de barra
              </label>
            </div>
            {errors.ean && (
              <span className="product-creator__error">{errors.ean}</span>
            )}
          </div>

          {/* EAN Match result */}
          {eanMatch && (
            <div className="product-creator__ean-match">
              <span
                className={`product-creator__ean-badge product-creator__ean-badge--${eanMatch.isAlreadyAssigned ? "error" : "success"}`}
              >
                {eanMatch.isAlreadyAssigned ? (
                  <AlertTriangle size={14} />
                ) : (
                  <Check size={14} />
                )}
                {eanMatch.isAlreadyAssigned
                  ? "Ya tenés este producto"
                  : "Producto encontrado en la base general"}
              </span>

              <div className="product-creator__ean-product">
                {eanMatch.image && (
                  <img
                    src={eanMatch.image}
                    alt={eanMatch.title}
                    className="product-creator__ean-img"
                  />
                )}
                <div>
                  <p className="product-creator__ean-product-title">
                    {eanMatch.title}
                  </p>
                  <span className="product-creator__ean-product-cat">
                    {eanMatch.category}
                  </span>
                </div>
              </div>

              {!eanMatch.isAlreadyAssigned && (
                <>
                  <div
                    className="product-creator__grid"
                    style={{ marginTop: 0 }}
                  >
                    <div className="product-creator__field">
                      <label>Tu precio final *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 1500"
                        value={eanCustomPrice}
                        onChange={(e) => setEanCustomPrice(e.target.value)}
                      />
                    </div>
                    <div className="product-creator__field">
                      <label>Precio de oferta</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 1300"
                        value={eanOfferPrice}
                        onChange={(e) => setEanOfferPrice(e.target.value)}
                      />
                    </div>
                    <div className="product-creator__field">
                      <label>Descuento (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ej: 10"
                        value={eanPercentDiscount}
                        onChange={(e) => setEanPercentDiscount(e.target.value)}
                      />
                    </div>
                    <div className="product-creator__field">
                      <label>Stock inicial *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 10"
                        value={eanStock}
                        onChange={(e) => setEanStock(e.target.value)}
                      />
                    </div>
                    <div className="product-creator__field">
                      <label>Moneda</label>
                      <select
                        value={eanCurrencyCode}
                        onChange={(e) => setEanCurrencyCode(e.target.value)}
                        className="dash-products__modal-select"
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          background: "var(--input-bg)",
                          fontSize: "var(--text-base)",
                        }}
                      >
                        <option value="ARG">Pesos ($)</option>
                        <option value="USD">Dólares (USD)</option>
                      </select>
                    </div>
                    <div className="product-creator__field product-creator__field--full">
                      <label>Enlace del producto (Opcional)</label>
                      <input
                        type="url"
                        placeholder="Ej: https://mi-sitio.com/producto"
                        value={eanLinkUrl}
                        onChange={(e) => setEanLinkUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Wholesale */}
                  <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                    <label
                      className="product-creator__wholesale-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={eanWholesale}
                        onChange={(e) => setEanWholesale(e.target.checked)}
                        style={{ width: "auto", margin: 0 }}
                      />
                      <span>Habilitar venta por mayor</span>
                    </label>

                    {eanWholesale && (
                      <div
                        className="product-creator__grid"
                        style={{ marginTop: "12px" }}
                      >
                        <div className="product-creator__field">
                          <label>Precio por mayor</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Ej: 1000"
                            value={eanWholesalePrice}
                            onChange={(e) =>
                              setEanWholesalePrice(e.target.value)
                            }
                          />
                        </div>
                        <div className="product-creator__field">
                          <label>Unidad mínima de compra</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Ej: 10"
                            value={eanWholesaleUnit}
                            onChange={(e) =>
                              setEanWholesaleUnit(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="product-creator__ean-actions">
                <button
                  className="product-creator__btn-cancel"
                  onClick={() => setEanMatch(null)}
                >
                  {eanMatch.isAlreadyAssigned ? "Cerrar" : "Crear uno nuevo"}
                </button>
                {!eanMatch.isAlreadyAssigned && (
                  <button
                    className="product-creator__btn-save"
                    onClick={handleAddFromEan}
                    disabled={
                      !eanCustomPrice ||
                      parseInt(eanCustomPrice) <= 0 ||
                      !eanStock ||
                      isSaving
                    }
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {isSaving ? "Guardando..." : "Agregar a mi catálogo"}
                  </button>
                )}
              </div>
            </div>
          )}

          {isScannerOpen && (
            <BarcodeScanner
              onScan={(text) => {
                set("ean", text);
                setIsScannerOpen(false);
              }}
              onClose={() => setIsScannerOpen(false)}
            />
          )}
        </div>

        {/* ── Sección 2: Datos del producto ── */}
        {!eanMatch && (
          <>
            <div className="product-creator__section">
              <p className="product-creator__section-title">
                <Package
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
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
                  {errors.name && (
                    <span className="product-creator__error">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="product-creator__field">
                  <label>Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Bosch, Samsung..."
                    value={newProduct.brand}
                    onChange={(e) => set("brand", e.target.value)}
                  />
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
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <span className="product-creator__error">
                      {errors.categoryId}
                    </span>
                  )}
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

            {/* ── Sección 2.5: Dimensiones ── */}
            <div className="product-creator__section">
              <p className="product-creator__section-title">
                <Package
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                Dimensiones (Obligatorio)
              </p>

              <div className="product-creator__grid">
                <div className="product-creator__field">
                  <label>Peso (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 1.5"
                    value={newProduct.weight}
                    onChange={(e) => set("weight", e.target.value)}
                  />
                  {errors.weight && (
                    <span className="product-creator__error">
                      {errors.weight}
                    </span>
                  )}
                </div>
                <div className="product-creator__field">
                  <label>Ancho (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ej: 20"
                    value={newProduct.width}
                    onChange={(e) => set("width", e.target.value)}
                  />
                  {errors.width && (
                    <span className="product-creator__error">
                      {errors.width}
                    </span>
                  )}
                </div>
                <div className="product-creator__field">
                  <label>Alto (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ej: 15"
                    value={newProduct.height}
                    onChange={(e) => set("height", e.target.value)}
                  />
                  {errors.height && (
                    <span className="product-creator__error">
                      {errors.height}
                    </span>
                  )}
                </div>
                <div className="product-creator__field">
                  <label>Profundidad (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ej: 30"
                    value={newProduct.depth}
                    onChange={(e) => set("depth", e.target.value)}
                  />
                  {errors.depth && (
                    <span className="product-creator__error">
                      {errors.depth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sección 3: Precios ── */}
            <div className="product-creator__section">
              <p className="product-creator__section-title">
                <Tag
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                Precios y stock
              </p>

              <div className="product-creator__grid">
                <div className="product-creator__field">
                  <label>Precio *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                  {errors.price && (
                    <span className="product-creator__error">
                      {errors.price}
                    </span>
                  )}
                </div>

                <div className="product-creator__field">
                  <label>Precio de Oferta</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newProduct.offerPrice}
                    onChange={(e) => set("offerPrice", e.target.value)}
                  />
                </div>

                <div className="product-creator__field">
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej: 10"
                    value={newProduct.percent_discount}
                    onChange={(e) => set("percent_discount", e.target.value)}
                  />
                </div>

                <div className="product-creator__field">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                  {errors.stock && (
                    <span className="product-creator__error">
                      {errors.stock}
                    </span>
                  )}
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
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 1000"
                        value={newProduct.wholesale_price}
                        onChange={(e) => set("wholesale_price", e.target.value)}
                      />
                    </div>
                    <div className="product-creator__field">
                      <label>Unidad mínima de compra</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ej: 10"
                        value={newProduct.wholesale_unit}
                        onChange={(e) => set("wholesale_unit", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Sección 4: Imágenes ── */}
            <div className="product-creator__section">
              <p className="product-creator__section-title">
                <ImageIcon
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                Imágenes ({imageFiles.length}/{MAX_PRODUCT_IMAGES})
              </p>

              <div
                style={{
                  background: "rgba(233, 72, 35, 0.1)",
                  color: "var(--accent-color)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={16} />
                <strong>Sube fotos con formato 1:1 (cuadrada).</strong> Las
                imágenes se recortarán automáticamente desde el centro para
                mantener este formato.
              </div>

              <div className="dash-products__image-preview-grid">
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={`preview-${idx}`}
                    className="dash-products__image-preview"
                    draggable
                    onDragStart={(e) => {
                      setDraggingNewImageIndex(idx);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleNewImageDrop(idx);
                    }}
                  >
                    <img src={preview} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      className="dash-products__image-remove"
                      onClick={() => removeImage(idx)}
                    >
                      <X size={14} />
                    </button>
                    {idx === 0 && (
                      <div className="dash-products__image-main-badge">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {imagePreviews.length < MAX_PRODUCT_IMAGES && (
                <label
                  className="dash-products__image-upload"
                  style={{ marginTop: "32px" }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isSaving}
                  />
                  <Upload size={24} className="icon-blue" />
                  <span>Subir foto</span>
                </label>
              )}
              <p className="product-creator__images-hint">
                Hasta {MAX_PRODUCT_IMAGES} imágenes. Arrastrá para reordenar. La
                primera es la imagen principal.
              </p>
            </div>

            {/* ── Footer ── */}
            <div className="product-creator__footer">
              <button
                type="button"
                className="product-creator__btn-cancel"
                onClick={onBack}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="product-creator__btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Guardar Producto
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      {/* end product-creator__body */}

      {/* ── Modal de éxito ── */}
      {showSuccessModal && (
        <div className="dash-products__overlay">
          <div className="dash-products__modal dash-products__modal--small dash-products__modal--success">
            <div className="modal-success-icon">
              <Check size={32} />
            </div>
            <h3>¡Producto guardado!</h3>
            <p>El producto se agregó correctamente a tu catálogo.</p>
            <button
              className="dash-products__modal-apply"
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
