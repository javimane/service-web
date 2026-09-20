"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  AlertCircle,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";
import { commerceService, ProductVariant } from "@/services/commerceService";
import { uploadProductImage } from "@/services/storageUploads";
import { getMultimediaUploadUrlAction } from "@/app/actions/multimedia";
import { multimediaService } from "@/services/multimediaService";
import { getAccessToken } from "@/utils/auth";
import { cropImageToSquare } from "@/utils/imageUtils";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import "./ProductVariantsModal.css";

const MAX_VARIANT_IMAGES = 4;
const MAX_VARIANT_VIDEOS = 2;

interface ProductVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalProductId: string;
  productName: string;
  basePrice?: number;
  baseOfferPrice?: number;
  baseWholesalePrice?: number;
  professionalId?: number;
}

export default function ProductVariantsModal({
  isOpen,
  onClose,
  professionalProductId,
  productName,
  basePrice,
  baseOfferPrice,
  baseWholesalePrice,
  professionalId,
}: ProductVariantsModalProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  // Form states
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [attrName, setAttrName] = useState("Color");
  const [attrValue, setAttrValue] = useState("");
  const [useProductPrice, setUseProductPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [customOfferPrice, setCustomOfferPrice] = useState<number | "">("");
  const [customWholesalePrice, setCustomWholesalePrice] = useState<number | "">("");
  const [priceDiff, setPriceDiff] = useState<number | "">(0);
  const [stock, setStock] = useState<number | "">(10);
  const [sku, setSku] = useState("");

  // Media states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState<string[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    data: variants = [],
    isLoading,
    refetch,
  } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", professionalProductId],
    queryFn: () => commerceService.variants(professionalProductId),
    enabled: isOpen && Boolean(professionalProductId),
  });

  const resetForm = () => {
    setEditingVariant(null);
    setAttrName("Color");
    setAttrValue("");
    setUseProductPrice(true);
    setCustomPrice("");
    setCustomOfferPrice("");
    setCustomWholesalePrice("");
    setPriceDiff(0);
    setStock(10);
    setSku("");
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setImagesToDelete([]);
    setExistingVideos([]);
    setNewVideoFiles([]);
    setNewVideoPreviews([]);
    setVideosToDelete([]);
  };

  const handleEditClick = (v: ProductVariant) => {
    setEditingVariant(v);
    setAttrName(v.attribute_name || "Color");
    setAttrValue(v.attribute_value || "");
    setUseProductPrice(Boolean(v.use_product_price));
    setPriceDiff(typeof v.price_difference === "number" ? v.price_difference : 0);
    setCustomPrice(typeof v.price === "number" ? v.price : "");
    setCustomOfferPrice(typeof v.offer_price === "number" ? v.offer_price : "");
    setCustomWholesalePrice(typeof v.wholesale_price === "number" ? v.wholesale_price : "");
    setStock(typeof v.stock === "number" ? v.stock : 0);
    setSku(v.sku || "");

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
      refetch();
    },
    onError: () => showError("No se pudo eliminar la variante."),
  });

  const handleSubmitVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrValue.trim()) {
      showError("El valor del atributo es obligatorio (ej: Azul, XL, 500ml).");
      return;
    }
    if (!useProductPrice && (customPrice === "" || Number(customPrice) < 0)) {
      showError("Ingresá un precio válido para la variante.");
      return;
    }

    setIsUploadingMedia(true);
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
          showError("No se pudo identificar al profesional para subir el video.");
          setIsUploadingMedia(false);
          return;
        }

        for (const file of newVideoFiles) {
          const fileType = file.type || "video/mp4";
          const urlRes = await getMultimediaUploadUrlAction({
            professionalId,
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

      if (editingVariant) {
        await commerceService.updateVariant(editingVariant.id, {
          name: `${attrName}: ${attrValue}`,
          attribute_name: attrName,
          attribute_value: attrValue,
          use_product_price: useProductPrice,
          price: priceVal,
          offer_price: offerPriceVal,
          wholesale_price: wholesalePriceVal,
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
          professional_product_id: professionalProductId,
          name: `${attrName}: ${attrValue}`,
          attribute_name: attrName,
          attribute_value: attrValue,
          use_product_price: useProductPrice,
          price: priceVal,
          offer_price: offerPriceVal,
          wholesale_price: wholesalePriceVal,
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
      refetch();
    } catch (err: any) {
      console.error("Error saving variant:", err);
      showError(err?.message || "Ocurrió un error al guardar la variante.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const totalImagesCount = existingImages.length + newImageFiles.length;
  const totalVideosCount = existingVideos.length + newVideoFiles.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestionar Variantes — ${productName}`}
    >
      <div className="product-variants-modal">
        <p className="variants-intro">
          Configurá variantes con atributos diferenciados (Color, Talle, Medida, etc.).
          Podés asignarles fotos, videos, precios individuales (precio regular, oferta y mayorista) o hacer que hereden los precios del producto base.
        </p>

        {/* Add / Edit Variant Form */}
        <form className="variant-add-form" onSubmit={handleSubmitVariant}>
          <div className="variant-form-header">
            <h4 className="variant-form-title">
              {editingVariant ? `Editando variante: ${editingVariant.name || editingVariant.attribute_value}` : "Nueva variante"}
            </h4>
            {editingVariant && (
              <button
                type="button"
                className="variant-cancel-btn"
                onClick={handleCancelEdit}
              >
                Cancelar edición
              </button>
            )}
          </div>

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

          {/* Media row (Images and Videos for Variant) */}
          <div className="variant-media-row">
            {/* Images section */}
            <div className="variant-media-col">
              <div className="variant-media-header">
                <label className="variant-label">
                  <ImageIcon size={14} /> Fotos ({totalImagesCount}/{MAX_VARIANT_IMAGES})
                </label>
                {totalImagesCount < MAX_VARIANT_IMAGES && (
                  <button
                    type="button"
                    className="variant-media-upload-btn"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload size={12} /> Subir foto
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

              <div className="variant-media-preview-list">
                {existingImages.map((url, idx) => (
                  <div key={`exist-img-${idx}`} className="variant-media-thumb">
                    <img src={url} alt={`Foto ${idx + 1}`} />
                    <button
                      type="button"
                      className="variant-media-remove-btn"
                      onClick={() => removeExistingImage(idx)}
                      title="Eliminar foto"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((preview, idx) => (
                  <div key={`new-img-${idx}`} className="variant-media-thumb">
                    <img src={preview} alt={`Nueva foto ${idx + 1}`} />
                    <button
                      type="button"
                      className="variant-media-remove-btn"
                      onClick={() => removeNewImage(idx)}
                      title="Eliminar foto"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {totalImagesCount === 0 && (
                  <span className="variant-media-empty-hint">Sin fotos específicas</span>
                )}
              </div>
            </div>

            {/* Videos section */}
            <div className="variant-media-col">
              <div className="variant-media-header">
                <label className="variant-label">
                  <Video size={14} /> Videos ({totalVideosCount}/{MAX_VARIANT_VIDEOS})
                </label>
                {totalVideosCount < MAX_VARIANT_VIDEOS && (
                  <button
                    type="button"
                    className="variant-media-upload-btn"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload size={12} /> Subir video
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

              <div className="variant-media-preview-list">
                {existingVideos.map((url, idx) => (
                  <div key={`exist-vid-${idx}`} className="variant-media-thumb variant-media-thumb--video">
                    <video src={url} preload="metadata" />
                    <span className="variant-media-video-badge">Video</span>
                    <button
                      type="button"
                      className="variant-media-remove-btn"
                      onClick={() => removeExistingVideo(idx)}
                      title="Eliminar video"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newVideoPreviews.map((preview, idx) => (
                  <div key={`new-vid-${idx}`} className="variant-media-thumb variant-media-thumb--video">
                    <video src={preview} preload="metadata" />
                    <span className="variant-media-video-badge">Nuevo</span>
                    <button
                      type="button"
                      className="variant-media-remove-btn"
                      onClick={() => removeNewVideo(idx)}
                      title="Eliminar video"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {totalVideosCount === 0 && (
                  <span className="variant-media-empty-hint">Sin videos específicos</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing options */}
          <div className="variant-price-inheritance">
            <label className="variant-checkbox-label">
              <input
                type="checkbox"
                checked={useProductPrice}
                onChange={(e) => setUseProductPrice(e.target.checked)}
              />
              <span>Heredar precios del producto principal</span>
            </label>
            {useProductPrice && typeof basePrice === "number" && (
              <span className="variant-inherited-hint">
                Base: ${basePrice.toLocaleString()} {baseOfferPrice ? `| Oferta: $${baseOfferPrice.toLocaleString()}` : ""} {baseWholesalePrice ? `| Mayorista: $${baseWholesalePrice.toLocaleString()}` : ""}
              </span>
            )}
          </div>

          {useProductPrice ? (
            <div className="variant-form-row">
              <div className="variant-form-group flex-1">
                <label className="variant-label">Ajuste / Dif. de precio ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0 (mismo precio)"
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
          ) : (
            <>
              <div className="variant-form-row">
                <div className="variant-form-group flex-1">
                  <label className="variant-label">Precio regular ($)*</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Ej: 12500"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : "")}
                  />
                </div>

                <div className="variant-form-group flex-1">
                  <label className="variant-label">Precio de oferta ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ej: 10900 (opcional)"
                    value={customOfferPrice}
                    onChange={(e) => setCustomOfferPrice(e.target.value ? parseFloat(e.target.value) : "")}
                  />
                </div>

                <div className="variant-form-group flex-1">
                  <label className="variant-label">Precio mayorista ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ej: 9500 (opcional)"
                    value={customWholesalePrice}
                    onChange={(e) => setCustomWholesalePrice(e.target.value ? parseFloat(e.target.value) : "")}
                  />
                </div>
              </div>

              <div className="variant-form-row">
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

                <div className="variant-form-group flex-2">
                  <label className="variant-label">SKU (opcional)</label>
                  <input
                    type="text"
                    placeholder="PROD-XL-NEG"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="variant-form-actions">
            <button
              type="submit"
              className="btn-primary variant-add-btn"
              disabled={isUploadingMedia}
            >
              {isUploadingMedia ? (
                <>
                  <Loader2 size={16} className="variant-spin" />
                  <span>Guardando...</span>
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
                    <th>Foto</th>
                    <th>Atributo</th>
                    <th>Valor</th>
                    <th>Modalidad</th>
                    <th>Precio</th>
                    <th>Oferta</th>
                    <th>Mayorista</th>
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

                    const thumbUrl = v.image_url || (Array.isArray(v.images) && v.images[0]);
                    const hasVideos = Boolean(v.video_url || (Array.isArray(v.videos) && v.videos.length > 0));

                    return (
                      <tr key={v.id}>
                        <td>
                          <div className="variant-table-media-cell">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={v.name}
                                className="variant-table-thumb"
                              />
                            ) : (
                              <div className="variant-table-no-thumb">
                                <ImageIcon size={16} />
                              </div>
                            )}
                            {hasVideos && (
                              <span className="variant-table-video-tag" title="Tiene video">
                                <Video size={10} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td><strong>{v.attribute_name}</strong></td>
                        <td>{v.attribute_value}</td>
                        <td>
                          {v.use_product_price ? (
                            <span className="variant-badge variant-badge--inherited">
                              Hereda {v.price_difference ? `(${v.price_difference > 0 ? `+$${v.price_difference}` : `-$${Math.abs(v.price_difference)}`})` : ""}
                            </span>
                          ) : (
                            <span className="variant-badge variant-badge--custom">
                              Propio
                            </span>
                          )}
                        </td>
                        <td>
                          {effectivePrice !== null && effectivePrice !== undefined
                            ? `$${effectivePrice.toLocaleString()}`
                            : "—"}
                        </td>
                        <td>
                          {effectiveOffer ? `$${effectiveOffer.toLocaleString()}` : "—"}
                        </td>
                        <td>
                          {effectiveWholesale ? `$${effectiveWholesale.toLocaleString()}` : "—"}
                        </td>
                        <td>
                          <span className="variant-stock-pill">{v.stock} u.</span>
                        </td>
                        <td>{v.sku || "—"}</td>
                        <td>
                          <div className="variant-row-actions">
                            <button
                              type="button"
                              className="variant-action-btn variant-action-btn--edit"
                              title="Editar variante"
                              onClick={() => handleEditClick(v)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="variant-action-btn variant-action-btn--delete"
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

        <div className="modal-actions-row">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </Modal>
  );
}
