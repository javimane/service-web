"use client";

import React, { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  Check,
  Percent,
  Truck,
  Tag,
  Package,
} from "lucide-react";
import { commerceService, ProductVariant } from "@/services/commerceService";
import { uploadProductImage } from "@/services/storageUploads";
import { getMultimediaUploadUrlAction } from "@/app/actions/multimedia";
import { multimediaService } from "@/services/multimediaService";
import { getAccessToken } from "@/utils/auth";
import { cropImageToSquare } from "@/utils/imageUtils";
import { getProductDetailAction } from "@/app/actions/products";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import "./ProductVariantsSection.css";

const MAX_VARIANT_IMAGES = 4;
const MAX_VARIANT_VIDEOS = 2;

const INSTALLMENT_COMMISSIONS: Record<number, number> = {
  1: 11.0,
  2: 13.5,
  3: 15.0,
  6: 19.5,
  9: 23.0,
  12: 27.0,
  18: 35.0,
};
const IVA_RATE = 0.21;

interface ProductVariantsSectionProps {
  productId?: string;
  onBack: () => void;
}

export default function ProductVariantsSection({
  productId,
  onBack,
}: ProductVariantsSectionProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();
  const { sessionStatus } = useAuth();

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  // Form states
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [attrName, setAttrName] = useState("Color");
  const [attrValue, setAttrValue] = useState("");
  const [useProductPrice, setUseProductPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [customOfferPrice, setCustomOfferPrice] = useState<number | "">("");
  const [customWholesalePrice, setCustomWholesalePrice] = useState<number | "">("");
  const [customWholesaleUnit, setCustomWholesaleUnit] = useState<number | "">("");
  const [priceDiff, setPriceDiff] = useState<number | "">(0);
  const [stock, setStock] = useState<number | "">(10);
  const [sku, setSku] = useState("");

  // New requested fields: cuotas sin interés y envío gratis
  const [installmentsEnabled, setInstallmentsEnabled] = useState(false);
  const [maxInstallments, setMaxInstallments] = useState(6);
  const [freeShipping, setFreeShipping] = useState(false);

  // Media states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState<string[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch product detail to display header info & inherited pricing
  const { data: productDetail } = useQuery({
    queryKey: ["product-detail", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await getProductDetailAction({ id: productId });
      return res?.data ?? null;
    },
    enabled: Boolean(productId),
  });

  const basePrice = productDetail?.price ? Number(productDetail.price) : undefined;
  const baseOfferPrice = productDetail?.offer_price ? Number(productDetail.offer_price) : undefined;
  const baseWholesalePrice = productDetail?.wholesale_price ? Number(productDetail.wholesale_price) : undefined;
  const baseWholesaleUnit = productDetail?.wholesale_unit ? Number(productDetail.wholesale_unit) : undefined;
  const productName = productDetail?.name || "Producto";

  // Fetch variants
  const {
    data: variants = [],
    isLoading: isLoadingVariants,
    refetch: refetchVariants,
  } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", productId],
    queryFn: () => commerceService.variants(productId!),
    enabled: Boolean(productId),
  });

  // Calculate effective current price for the variant
  const currentEffectivePrice = useMemo(() => {
    if (useProductPrice) {
      return typeof basePrice === "number" ? Math.max(0, basePrice + (Number(priceDiff) || 0)) : 0;
    }
    return typeof customPrice === "number" ? customPrice : 0;
  }, [useProductPrice, basePrice, priceDiff, customPrice]);

  // Financial breakdown for installments (commission + 21% IVA)
  const activeRate = installmentsEnabled
    ? (INSTALLMENT_COMMISSIONS[maxInstallments] ?? 19.5)
    : 11.0;
  const commissionAmount = (currentEffectivePrice * activeRate) / 100;
  const ivaOnCommission = commissionAmount * IVA_RATE;
  const totalDeduction = commissionAmount + ivaOnCommission;
  const netEarnings = Math.max(0, currentEffectivePrice - totalDeduction);

  const resetForm = () => {
    setEditingVariant(null);
    setAttrName("Color");
    setAttrValue("");
    setUseProductPrice(true);
    setCustomPrice("");
    setCustomOfferPrice("");
    setCustomWholesalePrice("");
    setCustomWholesaleUnit("");
    setPriceDiff(0);
    setStock(10);
    setSku("");
    setInstallmentsEnabled(false);
    setMaxInstallments(6);
    setFreeShipping(false);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setImagesToDelete([]);
    setExistingVideos([]);
    setNewVideoFiles([]);
    setNewVideoPreviews([]);
    setVideosToDelete([]);
  };

  const handleEditVariant = (v: ProductVariant) => {
    setEditingVariant(v);
    setAttrName(v.attribute_name || "Color");
    setAttrValue(v.attribute_value || "");
    setUseProductPrice(Boolean(v.use_product_price));
    setPriceDiff(typeof v.price_difference === "number" ? v.price_difference : 0);
    setCustomPrice(typeof v.price === "number" ? v.price : "");
    setCustomOfferPrice(typeof v.offer_price === "number" ? v.offer_price : "");
    setCustomWholesalePrice(typeof v.wholesale_price === "number" ? v.wholesale_price : "");
    setCustomWholesaleUnit(typeof v.wholesale_unit === "number" ? v.wholesale_unit : "");
    setStock(typeof v.stock === "number" ? v.stock : 0);
    setSku(v.sku || "");
    setInstallmentsEnabled(Boolean(v.installments_enabled));
    setMaxInstallments(v.max_installments || 6);
    setFreeShipping(Boolean(v.free_shipping));

    const imgs = Array.isArray(v.images) && v.images.length > 0
      ? v.images
      : v.image_url
        ? [v.image_url]
        : [];
    setExistingImages(imgs);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setImagesToDelete([]);

    const vids = Array.isArray(v.videos) && v.videos.length > 0
      ? v.videos
      : v.video_url
        ? [v.video_url]
        : [];
    setExistingVideos(vids);
    setNewVideoFiles([]);
    setNewVideoPreviews([]);
    setVideosToDelete([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Image handlers
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    const currentTotal = existingImages.length + newImageFiles.length;
    const availableSlots = MAX_VARIANT_IMAGES - currentTotal;
    if (availableSlots <= 0) {
      showError(`Máximo ${MAX_VARIANT_IMAGES} imágenes por variante.`);
      return;
    }

    const filesToProcess = incoming.slice(0, availableSlots);
    const croppedFiles = await Promise.all(
      filesToProcess.map((f) => cropImageToSquare(f).catch(() => f)),
    );

    setNewImageFiles((prev) => [...prev, ...croppedFiles]);

    const previews = await Promise.all(
      croppedFiles.map(
        (f) =>
          new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res((reader.result as string) || "");
            reader.readAsDataURL(f);
          }),
      ),
    );
    setNewImagePreviews((prev) => [...prev, ...previews.filter(Boolean)]);
    e.target.value = "";
  };

  const removeExistingImage = (idx: number) => {
    const urlToRemove = existingImages[idx];
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    if (urlToRemove) {
      setImagesToDelete((prev) => [...prev, urlToRemove]);
    }
  };

  const removeNewImage = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Video handlers
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    const currentTotal = existingVideos.length + newVideoFiles.length;
    const availableSlots = MAX_VARIANT_VIDEOS - currentTotal;
    if (availableSlots <= 0) {
      showError(`Máximo ${MAX_VARIANT_VIDEOS} videos por variante.`);
      return;
    }

    const filesToProcess = incoming.slice(0, availableSlots);
    setNewVideoFiles((prev) => [...prev, ...filesToProcess]);

    Promise.all(
      filesToProcess.map(
        (f) =>
          new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res((reader.result as string) || "");
            reader.readAsDataURL(f);
          }),
      ),
    ).then((previews) => {
      setNewVideoPreviews((prev) => [...prev, ...previews.filter(Boolean)]);
    });
    e.target.value = "";
  };

  const removeExistingVideo = (idx: number) => {
    const urlToRemove = existingVideos[idx];
    setExistingVideos((prev) => prev.filter((_, i) => i !== idx));
    if (urlToRemove) {
      setVideosToDelete((prev) => [...prev, urlToRemove]);
    }
  };

  const removeNewVideo = (idx: number) => {
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewVideoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commerceService.deleteVariant(id),
    onSuccess: () => {
      showSuccess("Variante eliminada exitosamente.");
      if (editingVariant) resetForm();
      refetchVariants();
    },
    onError: () => showError("No se pudo eliminar la variante."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      showError("ID de producto no válido.");
      return;
    }
    if (!attrValue.trim()) {
      showError("El valor del atributo es obligatorio (ej: Azul, XL, 500ml).");
      return;
    }
    if (!useProductPrice && (customPrice === "" || Number(customPrice) < 0)) {
      showError("Ingresá un precio válido para la variante.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload new image files
      const uploadedImages: string[] = [];
      for (const file of newImageFiles) {
        const up = await uploadProductImage({
          file,
          entityId: `${productName}-${attrValue}-variant`,
        });
        if (up?.publicUrl) {
          uploadedImages.push(up.publicUrl);
        }
      }

      // 2. Upload new video files
      const token = getAccessToken();
      const uploadedVideos: string[] = [];
      if (newVideoFiles.length > 0) {
        if (!professionalId) {
          showError("No se pudo identificar al profesional para subir videos.");
          setIsSaving(false);
          return;
        }

        for (const file of newVideoFiles) {
          const fileType = file.type || "video/mp4";
          const urlRes = await getMultimediaUploadUrlAction({
            professionalId: Number(professionalId),
            fileName: file.name,
            fileType,
            type: "PRODUCT",
            token: token || undefined,
          });
          const uploadInfo = urlRes?.data ?? urlRes;
          if (uploadInfo?.uploadUrl && uploadInfo?.key) {
            await multimediaService.uploadToPresignedUrl(
              uploadInfo.uploadUrl,
              file,
              fileType,
            );
            uploadedVideos.push(uploadInfo.key);
          }
        }
      }

      const allImages = [...existingImages, ...uploadedImages];
      const allVideos = [...existingVideos, ...uploadedVideos];

      const priceVal = useProductPrice
        ? (basePrice ? Number(basePrice) + (Number(priceDiff) || 0) : 0)
        : (Number(customPrice) || 0);

      const offerPriceVal = useProductPrice
        ? (Number(baseOfferPrice) || 0)
        : (Number(customOfferPrice) || 0);

      const wholesalePriceVal = useProductPrice
        ? (Number(baseWholesalePrice) || 0)
        : (Number(customWholesalePrice) || 0);

      const wholesaleUnitVal = useProductPrice
        ? (Number(baseWholesaleUnit) || 0)
        : (Number(customWholesaleUnit) || 0);

      if (editingVariant) {
        await commerceService.updateVariant(editingVariant.id, {
          name: `${attrName}: ${attrValue}`,
          attribute_name: attrName,
          attribute_value: attrValue,
          use_product_price: useProductPrice,
          price: priceVal,
          offer_price: offerPriceVal,
          wholesale_price: wholesalePriceVal,
          wholesale_unit: wholesaleUnitVal,
          installments_enabled: installmentsEnabled,
          max_installments: installmentsEnabled ? maxInstallments : undefined,
          free_shipping: freeShipping,
          price_difference: typeof priceDiff === "number" ? priceDiff : 0,
          stock: typeof stock === "number" ? stock : 0,
          sku: sku.trim() || undefined,
          image_url: allImages[0] || null,
          images: allImages,
          images_to_save: uploadedImages.length > 0 ? uploadedImages : undefined,
          images_to_delete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
          video_url: allVideos[0] || null,
          videos: allVideos,
          videos_to_save: uploadedVideos.length > 0 ? uploadedVideos : undefined,
          videos_to_delete: videosToDelete.length > 0 ? videosToDelete : undefined,
        });
        showSuccess("Variante actualizada exitosamente.");
      } else {
        await commerceService.createVariant({
          professional_product_id: productId,
          name: `${attrName}: ${attrValue}`,
          attribute_name: attrName,
          attribute_value: attrValue,
          use_product_price: useProductPrice,
          price: priceVal,
          offer_price: offerPriceVal,
          wholesale_price: wholesalePriceVal,
          wholesale_unit: wholesaleUnitVal,
          installments_enabled: installmentsEnabled,
          max_installments: installmentsEnabled ? maxInstallments : undefined,
          free_shipping: freeShipping,
          price_difference: typeof priceDiff === "number" ? priceDiff : 0,
          stock: typeof stock === "number" ? stock : 0,
          sku: sku.trim() || undefined,
          image_url: allImages[0] || undefined,
          images: allImages,
          images_to_save: uploadedImages.length > 0 ? uploadedImages : undefined,
          video_url: allVideos[0] || undefined,
          videos: allVideos,
          videos_to_save: uploadedVideos.length > 0 ? uploadedVideos : undefined,
        });
        showSuccess("Variante agregada exitosamente.");
      }

      resetForm();
      refetchVariants();
    } catch (err: any) {
      console.error("Error saving variant:", err);
      showError(err?.message || "Ocurrió un error al guardar la variante.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalImagesCount = existingImages.length + newImageFiles.length;
  const totalVideosCount = existingVideos.length + newVideoFiles.length;

  return (
    <div className="product-variants-page">
      {/* Top Navigation Bar */}
      <div className="product-variants-page__header">
        <button
          type="button"
          className="product-variants-page__back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          <span>Volver al catálogo</span>
        </button>

        <div className="product-variants-page__title-wrap">
          <h2 className="product-variants-page__title">
            Gestión de Variantes
          </h2>
          <span className="product-variants-page__count-badge">
            {variants.length} variante{variants.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Product Reference Card */}
      {productDetail && (
        <div className="product-variants-page__ref-card">
          <div className="product-variants-page__ref-info">
            <div className="product-variants-page__ref-title-row">
              <Package size={20} className="product-variants-page__ref-icon" />
              <strong className="product-variants-page__ref-name">{productName}</strong>
              {productDetail.category && (
                <span className="product-variants-page__ref-badge">
                  {productDetail.category}
                </span>
              )}
            </div>
            <div className="product-variants-page__ref-prices">
              <span>
                Precio Base: <strong>${basePrice ? basePrice.toLocaleString("es-AR") : "0"}</strong>
              </span>
              {baseOfferPrice ? (
                <span>
                  | Oferta: <strong>${baseOfferPrice.toLocaleString("es-AR")}</strong>
                </span>
              ) : null}
              {baseWholesalePrice ? (
                <span>
                  | Mayorista: <strong>${baseWholesalePrice.toLocaleString("es-AR")}</strong> (desde {baseWholesaleUnit || 1} u.)
                </span>
              ) : null}
              <span>
                | Stock Principal: <strong>{productDetail.stock ?? 0} u.</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left/Top + Table on Right/Bottom */}
      <div className="product-variants-page__content-layout">
        {/* Form Column */}
        <div className="product-variants-page__form-panel">
          <form className="variant-editor-card" onSubmit={handleSubmit}>
            <div className="variant-editor-card__header">
              <div className="variant-editor-card__title-row">
                <Layers size={20} className="variant-editor-card__title-icon" />
                <h3 className="variant-editor-card__title">
                  {editingVariant ? `Editar Variante: ${editingVariant.name || editingVariant.attribute_value}` : "Crear Nueva Variante"}
                </h3>
              </div>
              {editingVariant && (
                <button
                  type="button"
                  className="variant-editor-card__cancel-btn"
                  onClick={handleCancelEdit}
                >
                  Cancelar edición
                </button>
              )}
            </div>

            {/* Atributo & Valor */}
            <div className="variant-editor-card__row">
              <div className="variant-editor-card__field flex-1">
                <label className="variant-editor-card__label">Atributo*</label>
                <select
                  value={attrName}
                  onChange={(e) => setAttrName(e.target.value)}
                  className="variant-editor-card__select"
                >
                  <option value="Color">Color</option>
                  <option value="Talle">Talle</option>
                  <option value="Capacidad">Capacidad</option>
                  <option value="Medida">Medida</option>
                  <option value="Material">Material</option>
                  <option value="Modelo">Modelo</option>
                </select>
              </div>

              <div className="variant-editor-card__field flex-2">
                <label className="variant-editor-card__label">Valor del atributo*</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Negro mate / XL / 500 ml"
                  value={attrValue}
                  onChange={(e) => setAttrValue(e.target.value)}
                  className="variant-editor-card__input"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="variant-editor-card__section">
              <h4 className="variant-editor-card__section-title">
                <Tag size={15} /> Precios y Condiciones
              </h4>

              <div className="variant-editor-card__inheritance-box">
                <label className="variant-editor-card__checkbox-label">
                  <input
                    type="checkbox"
                    checked={useProductPrice}
                    onChange={(e) => setUseProductPrice(e.target.checked)}
                  />
                  <span>Heredar precios del producto principal</span>
                </label>
                {useProductPrice && (
                  <span className="variant-editor-card__inheritance-hint">
                    Hereda: Regular ${basePrice?.toLocaleString("es-AR") || 0}
                    {baseOfferPrice ? ` | Oferta $${baseOfferPrice.toLocaleString("es-AR")}` : ""}
                    {baseWholesalePrice ? ` | Mayorista $${baseWholesalePrice.toLocaleString("es-AR")}` : ""}
                  </span>
                )}
              </div>

              {useProductPrice ? (
                <div className="variant-editor-card__row">
                  <div className="variant-editor-card__field flex-1">
                    <label className="variant-editor-card__label">Diferencia / Ajuste de precio ($)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0 (mismo precio)"
                      value={priceDiff}
                      onChange={(e) => setPriceDiff(parseFloat(e.target.value) || 0)}
                      className="variant-editor-card__input"
                    />
                    <small className="variant-editor-card__hint">
                      Precio resultante: ${currentEffectivePrice.toLocaleString("es-AR")}
                    </small>
                  </div>
                </div>
              ) : (
                <>
                  <div className="variant-editor-card__row">
                    <div className="variant-editor-card__field flex-1">
                      <label className="variant-editor-card__label">Precio regular ($)*</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="Ej: 15000"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : "")}
                        className="variant-editor-card__input"
                      />
                    </div>

                    <div className="variant-editor-card__field flex-1">
                      <label className="variant-editor-card__label">Precio de oferta ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ej: 12900 (opcional)"
                        value={customOfferPrice}
                        onChange={(e) => setCustomOfferPrice(e.target.value ? parseFloat(e.target.value) : "")}
                        className="variant-editor-card__input"
                      />
                    </div>
                  </div>

                  <div className="variant-editor-card__row">
                    <div className="variant-editor-card__field flex-1">
                      <label className="variant-editor-card__label">Precio por mayor ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ej: 9900 (opcional)"
                        value={customWholesalePrice}
                        onChange={(e) => setCustomWholesalePrice(e.target.value ? parseFloat(e.target.value) : "")}
                        className="variant-editor-card__input"
                      />
                    </div>

                    <div className="variant-editor-card__field flex-1">
                      <label className="variant-editor-card__label">Cantidad mínima mayorista (u.)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ej: 10 (opcional)"
                        value={customWholesaleUnit}
                        onChange={(e) => setCustomWholesaleUnit(e.target.value ? parseInt(e.target.value, 10) : "")}
                        className="variant-editor-card__input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cuotas sin interés y desglose financiero */}
            <div className="variant-editor-card__section">
              <div className="variant-editor-card__checkbox-box">
                <label className="variant-editor-card__checkbox-label">
                  <input
                    type="checkbox"
                    checked={installmentsEnabled}
                    onChange={(e) => setInstallmentsEnabled(e.target.checked)}
                  />
                  <span>Habilitar cuotas sin interés para esta variante</span>
                </label>
              </div>

              {installmentsEnabled && (
                <div className="variant-installments-config">
                  <div className="variant-editor-card__field">
                    <label className="variant-editor-card__label">Máximo de cuotas permitidas</label>
                    <select
                      value={maxInstallments}
                      onChange={(e) => setMaxInstallments(parseInt(e.target.value, 10))}
                      className="variant-editor-card__select"
                    >
                      <option value={3}>Hasta 3 cuotas fijas (15% comisión base)</option>
                      <option value={6}>Hasta 6 cuotas fijas (19.5% comisión base)</option>
                      <option value={9}>Hasta 9 cuotas fijas (23% comisión base)</option>
                      <option value={12}>Hasta 12 cuotas fijas (27% comisión base)</option>
                      <option value={18}>Hasta 18 cuotas fijas (35% comisión base)</option>
                    </select>
                  </div>

                  {/* Desglose de comisión de venta + 21% IVA */}
                  {currentEffectivePrice > 0 && (
                    <div className="variant-commission-box">
                      <div className="variant-commission-box__header">
                        <span className="variant-commission-box__title">
                          <Percent size={14} /> Desglose de liquidación por venta
                        </span>
                        <span className="variant-commission-box__badge">
                          {activeRate}% base + 21% IVA
                        </span>
                      </div>

                      <div className="variant-commission-box__rows">
                        <div className="variant-commission-box__row">
                          <span>Precio de venta al público:</span>
                          <strong>${currentEffectivePrice.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="variant-commission-box__row variant-commission-box__row--deduct">
                          <span>Comisión de plataforma ({activeRate}%):</span>
                          <strong>-${commissionAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="variant-commission-box__row variant-commission-box__row--deduct">
                          <span>IVA sobre comisión (21%):</span>
                          <strong>-${ivaOnCommission.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="variant-commission-box__row variant-commission-box__row--total-deduct">
                          <span>Total retención ({(activeRate * 1.21).toFixed(2)}%):</span>
                          <strong>-${totalDeduction.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="variant-commission-box__row variant-commission-box__row--net">
                          <span>Cobras neto en tu cuenta:</span>
                          <strong>${netEarnings.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Envío Gratis */}
            <div className="variant-editor-card__section">
              <div className="variant-editor-card__checkbox-box">
                <label className="variant-editor-card__checkbox-label">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                  />
                  <span>
                    <Truck size={15} className="variant-editor-card__inline-icon" /> Ofrecer envío gratis en esta variante
                  </span>
                </label>
              </div>
            </div>

            {/* Multimedia: Fotos y Videos */}
            <div className="variant-editor-card__section">
              <h4 className="variant-editor-card__section-title">
                <ImageIcon size={15} /> Multimedia de la variante
              </h4>

              <div className="variant-media-grid">
                {/* Images Column */}
                <div className="variant-media-block">
                  <div className="variant-media-block__head">
                    <label className="variant-editor-card__label">
                      Fotos ({totalImagesCount}/{MAX_VARIANT_IMAGES})
                    </label>
                    {totalImagesCount < MAX_VARIANT_IMAGES && (
                      <button
                        type="button"
                        className="variant-media-block__upload-btn"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload size={13} /> Subir foto
                      </button>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="variant-media-block__thumbs">
                    {existingImages.map((url, idx) => (
                      <div key={`exist-img-${idx}`} className="variant-media-item">
                        <img src={url} alt={`Foto ${idx + 1}`} />
                        <button
                          type="button"
                          className="variant-media-item__remove-btn"
                          onClick={() => removeExistingImage(idx)}
                          title="Eliminar foto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {newImagePreviews.map((preview, idx) => (
                      <div key={`new-img-${idx}`} className="variant-media-item">
                        <img src={preview} alt={`Nueva foto ${idx + 1}`} />
                        <button
                          type="button"
                          className="variant-media-item__remove-btn"
                          onClick={() => removeNewImage(idx)}
                          title="Eliminar foto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {totalImagesCount === 0 && (
                      <span className="variant-media-block__empty-hint">
                        Sin fotos diferenciadas (usará la foto principal del producto)
                      </span>
                    )}
                  </div>
                </div>

                {/* Videos Column */}
                <div className="variant-media-block">
                  <div className="variant-media-block__head">
                    <label className="variant-editor-card__label">
                      Videos ({totalVideosCount}/{MAX_VARIANT_VIDEOS})
                    </label>
                    {totalVideosCount < MAX_VARIANT_VIDEOS && (
                      <button
                        type="button"
                        className="variant-media-block__upload-btn"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <Upload size={13} /> Subir video
                      </button>
                    )}
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      hidden
                      onChange={handleVideoChange}
                    />
                  </div>

                  <div className="variant-media-block__thumbs">
                    {existingVideos.map((url, idx) => (
                      <div key={`exist-vid-${idx}`} className="variant-media-item variant-media-item--video">
                        <video src={url} preload="metadata" />
                        <span className="variant-media-item__badge">Video</span>
                        <button
                          type="button"
                          className="variant-media-item__remove-btn"
                          onClick={() => removeExistingVideo(idx)}
                          title="Eliminar video"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {newVideoPreviews.map((preview, idx) => (
                      <div key={`new-vid-${idx}`} className="variant-media-item variant-media-item--video">
                        <video src={preview} preload="metadata" />
                        <span className="variant-media-item__badge">Nuevo</span>
                        <button
                          type="button"
                          className="variant-media-item__remove-btn"
                          onClick={() => removeNewVideo(idx)}
                          title="Eliminar video"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {totalVideosCount === 0 && (
                      <span className="variant-media-block__empty-hint">
                        Sin videos específicos cargados
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock y SKU */}
            <div className="variant-editor-card__row">
              <div className="variant-editor-card__field flex-1">
                <label className="variant-editor-card__label">Stock específico*</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="10"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                  className="variant-editor-card__input"
                />
              </div>

              <div className="variant-editor-card__field flex-2">
                <label className="variant-editor-card__label">SKU / Código interno (opcional)</label>
                <input
                  type="text"
                  placeholder="PROD-VAR-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="variant-editor-card__input"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="variant-editor-card__actions">
              {editingVariant && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn-primary variant-editor-card__submit-btn"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="variant-spin" />
                    <span>Guardando variante...</span>
                  </>
                ) : editingVariant ? (
                  <>
                    <Check size={16} />
                    <span>Actualizar variante</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Agregar variante</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Variants List Table Column */}
        <div className="product-variants-page__table-panel">
          <div className="variant-table-card">
            <div className="variant-table-card__header">
              <h3 className="variant-table-card__title">
                Listado de Variantes ({variants.length})
              </h3>
              <p className="variant-table-card__subtitle">
                Estas son las opciones disponibles para tus compradores en la tienda.
              </p>
            </div>

            {isLoadingVariants ? (
              <div className="variant-table-card__loading">
                <Loader2 size={24} className="variant-spin" />
                <span>Cargando variantes...</span>
              </div>
            ) : variants.length === 0 ? (
              <div className="variant-table-card__empty">
                <Layers size={40} />
                <p>Este producto aún no cuenta con variantes creadas.</p>
                <small>Completa el formulario a la izquierda para agregar la primera variante.</small>
              </div>
            ) : (
              <div className="variant-table-card__table-wrap">
                <table className="variant-data-table">
                  <thead>
                    <tr>
                      <th>Multimedia</th>
                      <th>Atributo</th>
                      <th>Valor</th>
                      <th>Modalidad</th>
                      <th>Precio Regular</th>
                      <th>Precio Oferta</th>
                      <th>Mayorista</th>
                      <th>Cuotas</th>
                      <th>Envío</th>
                      <th>Stock</th>
                      <th>SKU</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const effectivePrice = v.use_product_price
                        ? (typeof basePrice === "number" ? basePrice + (v.price_difference || 0) : null)
                        : v.price;
                      const effectiveOffer = v.use_product_price
                        ? (typeof baseOfferPrice === "number" ? baseOfferPrice + (v.price_difference || 0) : null)
                        : v.offer_price;
                      const effectiveWholesale = v.use_product_price
                        ? (typeof baseWholesalePrice === "number" ? baseWholesalePrice + (v.price_difference || 0) : null)
                        : v.wholesale_price;
                      const effectiveWholesaleUnits = v.use_product_price
                        ? baseWholesaleUnit
                        : v.wholesale_unit;

                      const thumbUrl = v.image_url || (Array.isArray(v.images) && v.images[0]);
                      const hasVideos = Boolean(v.video_url || (Array.isArray(v.videos) && v.videos.length > 0));

                      return (
                        <tr key={v.id} className={editingVariant?.id === v.id ? "variant-data-table__row--active" : ""}>
                          <td>
                            <div className="variant-data-table__media-cell">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={v.name}
                                  className="variant-data-table__thumb"
                                />
                              ) : (
                                <div className="variant-data-table__no-thumb">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              {hasVideos && (
                                <span className="variant-data-table__video-badge" title="Tiene video">
                                  <Video size={10} />
                                </span>
                              )}
                            </div>
                          </td>
                          <td><strong>{v.attribute_name}</strong></td>
                          <td>{v.attribute_value}</td>
                          <td>
                            {v.use_product_price ? (
                              <span className="variant-pill variant-pill--inherited">
                                Hereda {v.price_difference ? `(${v.price_difference > 0 ? `+$${v.price_difference}` : `-$${Math.abs(v.price_difference)}`})` : ""}
                              </span>
                            ) : (
                              <span className="variant-pill variant-pill--custom">
                                Propio
                              </span>
                            )}
                          </td>
                          <td>
                            {effectivePrice !== null && effectivePrice !== undefined
                              ? `$${effectivePrice.toLocaleString("es-AR")}`
                              : "—"}
                          </td>
                          <td>
                            {effectiveOffer ? `$${effectiveOffer.toLocaleString("es-AR")}` : "—"}
                          </td>
                          <td>
                            {effectiveWholesale ? (
                              <div className="variant-wholesale-cell">
                                <span>${effectiveWholesale.toLocaleString("es-AR")}</span>
                                {effectiveWholesaleUnits ? (
                                  <small className="variant-wholesale-units">
                                    (desde {effectiveWholesaleUnits} u.)
                                  </small>
                                ) : null}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {v.installments_enabled ? (
                              <span className="variant-pill variant-pill--installments" title="Cuotas sin interés habilitadas">
                                {v.max_installments || 6} c. s/int
                              </span>
                            ) : (
                              <span className="variant-pill variant-pill--neutral">1 pago</span>
                            )}
                          </td>
                          <td>
                            {v.free_shipping ? (
                              <span className="variant-pill variant-pill--shipping" title="Envío gratis habilitado">
                                <Truck size={10} /> Gratis
                              </span>
                            ) : (
                              <span className="variant-pill variant-pill--neutral">Estándar</span>
                            )}
                          </td>
                          <td>
                            <span className="variant-stock-tag">{v.stock} u.</span>
                          </td>
                          <td>{v.sku || "—"}</td>
                          <td>
                            <div className="variant-data-table__actions">
                              <button
                                type="button"
                                className="variant-action-icon variant-action-icon--edit"
                                title="Editar variante"
                                onClick={() => handleEditVariant(v)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="variant-action-icon variant-action-icon--delete"
                                title="Eliminar variante"
                                onClick={() => deleteMutation.mutate(v.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
