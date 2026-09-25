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
  Video,
  Film,
  Trash2,
  Layers,
  Truck,
  Car,
  Info,
  Percent,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";
import {
  getProductCategoriesAction,
  getProductSubcategoriesAction,
} from "../../../app/actions/categories";
import { getAccessToken } from "../../../utils/auth";
import { uploadProductImage } from "../../../services/storageUploads";
import { getMultimediaUploadUrlAction } from "../../../app/actions/multimedia";
import { multimediaService } from "../../../services/multimediaService";
import {
  commerceService,
  type MarketplaceCommission,
} from "../../../services/commerceService";
import BarcodeScanner from "../../../components/BarcodeScanner/BarcodeScanner";
import { cropImageToSquare } from "../../../utils/imageUtils";
import "./DashboardProducts.css";
import "./ProductCreator.css";
import {
  assignProductToProfessionalAction,
  createProductAction,
  getProductByEanAction,
  getProductDetailAction,
  updateProfessionalProductAction,
  updateProductAction,
} from "@/app/actions/products";

const MAX_PRODUCT_VIDEOS = 2;
const installmentOptions: readonly number[] = [3, 6, 9, 12, 18];
const normalizeMaxInstallments = (value: unknown): number => {
  const count = Number(value);
  return installmentOptions.includes(count) ? count : 3;
};
type ProductAttribute = { name: string; value: string };
const emptyAttribute = (): ProductAttribute => ({ name: "", value: "" });
const commonAttributes = [
  "Color",
  "Almacenamiento",
  "Capacidad",
  "Talle",
  "Medida",
  "Material",
  "Modelo",
];

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
  variantParent?: any;
}

export default function ProductCreator({
  onBack,
  productToEdit,
  variantParent,
}: ProductCreatorProps) {
  const router = useRouter();
  const { showError } = useAlert();
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    categoryId: "",
    subcategoryId: "",
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
    wholesale: false,
    wholesale_price: "",
    wholesale_unit: "",
    offer_2x1: false,
    offer_3x2: false,
    image: "",
  });

  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggingNewImageIndex, setDraggingNewImageIndex] = useState<
    number | null
  >(null);

  // Video state (up to 2 videos per product)
  const [videoFiles, setVideoFiles] = useState<(File | null)[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    emptyAttribute(),
  ]);
  const [inheritName, setInheritName] = useState(
    Boolean(variantParent && !productToEdit),
  );
  const [inheritDescription, setInheritDescription] = useState(
    Boolean(variantParent && !productToEdit),
  );
  const [inheritDimensions, setInheritDimensions] = useState(
    Boolean(variantParent && !productToEdit),
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [eanLoading, setEanLoading] = useState(false);
  const [eanMatch, setEanMatch] = useState<any>(null);
  const [eanCheckedAndFree, setEanCheckedAndFree] = useState(false);
  const [eanCustomPrice, setEanCustomPrice] = useState("");
  const [eanStock, setEanStock] = useState("");
  const [eanOfferPrice, setEanOfferPrice] = useState("");
  const [eanCurrencyCode, setEanCurrencyCode] = useState("ARG");
  const [eanPercentDiscount, setEanPercentDiscount] = useState("");
  const [eanWholesale, setEanWholesale] = useState(false);
  const [eanWholesalePrice, setEanWholesalePrice] = useState("");
  const [eanWholesaleUnit, setEanWholesaleUnit] = useState("");
  const [eanOfferType, setEanOfferType] = useState("none");

  const [installmentsEnabled, setInstallmentsEnabled] = useState(
    Boolean(productToEdit?.installments_enabled),
  );
  const [maxInstallments, setMaxInstallments] = useState(
    normalizeMaxInstallments(productToEdit?.max_installments),
  );
  const [freeShipping, setFreeShipping] = useState(
    Boolean(productToEdit?.free_shipping),
  );
  const [freeShippingRadiusKm, setFreeShippingRadiusKm] = useState(
    productToEdit?.free_shipping_radius_km !== undefined &&
      productToEdit?.free_shipping_radius_km !== null
      ? String(productToEdit.free_shipping_radius_km)
      : "",
  );
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(
    productToEdit?.free_shipping_min_amount !== undefined &&
      productToEdit?.free_shipping_min_amount !== null
      ? String(productToEdit.free_shipping_min_amount)
      : "",
  );
  const [freeShippingMaxWeight, setFreeShippingMaxWeight] = useState(
    productToEdit?.free_shipping_max_weight !== undefined &&
      productToEdit?.free_shipping_max_weight !== null
      ? String(productToEdit.free_shipping_max_weight)
      : "",
  );
  const [freeShippingCountry, setFreeShippingCountry] = useState(
    Boolean(
      productToEdit?.free_shipping_country ??
      (variantParent && !productToEdit
        ? variantParent.free_shipping_country
        : false),
    ),
  );
  const [freeShippingCountryMinAmount, setFreeShippingCountryMinAmount] = useState(
    String(
      productToEdit?.free_shipping_country_min_amount ??
        (variantParent && !productToEdit
          ? variantParent.free_shipping_country_min_amount
          : null) ??
        (productToEdit?.free_shipping_country || variantParent?.free_shipping_country
          ? 0
          : ""),
    ),
  );

  const [inheritWarranty, setInheritWarranty] = useState(
    Boolean(variantParent && !productToEdit),
  );
  const [isCustomWarranty, setIsCustomWarranty] = useState(false);
  const [eanWarranty, setEanWarranty] = useState<number>(0);

  const [warranty, setWarranty] = useState<number>(
    productToEdit?.warranty !== undefined && productToEdit?.warranty !== null
      ? Number(productToEdit.warranty)
      : 0,
  );

  const { data: shippingPolicy } = useQuery({
    queryKey: ["shipping-policy", professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      return await commerceService.getShippingPolicy(Number(professionalId));
    },
    enabled: Boolean(professionalId),
  });

  const {
    data: commissionRates = [],
    isPending: commissionsLoading,
    isError: commissionsError,
  } = useQuery<MarketplaceCommission[]>({
    queryKey: ["marketplace-commissions"],
    queryFn: commerceService.commissions,
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-products"],
    queryFn: async () => {
      const result = await getProductCategoriesAction();
      return result?.data ?? [];
    },
  });

  const selectedCategoryObj = categories.find(
    (c: any) => String(c.id) === String(newProduct.categoryId),
  );
  const isFoodCategory = Boolean(
    selectedCategoryObj?.name &&
    /alimento|comida|bebida|pereced|fresco|panader/i.test(
      selectedCategoryObj.name,
    ),
  );

  const { data: subcategories = [] } = useQuery({
    queryKey: ["categories-products-subcategories", newProduct.categoryId],
    queryFn: async () => {
      const categoryId = newProduct.categoryId;
      const result = await getProductSubcategoriesAction({
        categoryId,
      });
      return result?.data ?? [];
    },
    enabled: Number.isFinite(Number(newProduct.categoryId)),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
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
      if (variantParent && result?.data) {
        await commerceService.linkVariant(
          variantParent.professional_product_id,
          String(data.product_id),
        );
      }
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
    if (!variantParent || productToEdit) return;
    setNewProduct((previous) => ({
      ...previous,
      name: variantParent.name || "",
      brand: variantParent.brand || "",
      categoryId: String(variantParent.categories_products_id || ""),
      subcategoryId: String(variantParent.sub_categories_products_id || ""),
      description: variantParent.description || "",
      weight: variantParent.weight != null ? String(variantParent.weight) : "",
      width: variantParent.width != null ? String(variantParent.width) : "",
      height: variantParent.height != null ? String(variantParent.height) : "",
      depth: variantParent.depth != null ? String(variantParent.depth) : "",
    }));
    setAttributes([emptyAttribute()]);
    setFormPrice(String(variantParent.price ?? ""));
    setFormStock("0");
    if (
      variantParent.warranty !== undefined &&
      variantParent.warranty !== null
    ) {
      setWarranty(Number(variantParent.warranty));
      setIsCustomWarranty(
        ![0, 1, 2, 3, 6, 12, 18, 24, 36, 48, 60].includes(
          Number(variantParent.warranty),
        ),
      );
      setInheritWarranty(true);
    }
  }, [variantParent, productToEdit]);

  useEffect(() => {
    if (!productToEdit) return;

    let isMounted = true;

    const loadFullProductData = async () => {
      let fullProduct = productToEdit;
      const productId = productToEdit.id || productToEdit.product_id;

      if (productId) {
        try {
          const detailRes = await getProductDetailAction({ id: productId });
          if (detailRes?.data) {
            const merchantListing = Array.isArray(detailRes.data.ProfessionalProducts)
              ? detailRes.data.ProfessionalProducts.find(
                  (listing: any) =>
                    Number(listing.professional_id) === Number(professionalId),
                )
              : null;
            fullProduct = {
              ...productToEdit,
              ...detailRes.data,
              ...(merchantListing
                ? {
                    warranty: merchantListing.warranty,
                    installments_enabled: merchantListing.installments_enabled,
                    max_installments: merchantListing.max_installments,
                    free_shipping_country: merchantListing.free_shipping_country,
                    free_shipping_country_min_amount:
                      merchantListing.free_shipping_country_min_amount,
                  }
                : {}),
            };
          }
        } catch (err) {
          console.error("Error fetching product detail for edit:", err);
        }
      }

      if (!isMounted) return;

      setNewProduct((prev) => ({
        ...prev,
        name: fullProduct.name || "",
        brand: fullProduct.brand || "",
        categoryId:
          categories
            .find((c: any) => c.name === fullProduct.category)
            ?.id?.toString() ||
          fullProduct.categories_products_id?.toString() ||
          fullProduct.Category?.id?.toString() ||
          "",
        subcategoryId:
          fullProduct.sub_categories_products_id?.toString() ||
          fullProduct.subcategoryId?.toString() ||
          fullProduct.SubCategory?.id?.toString() ||
          fullProduct.subCategory?.id?.toString() ||
          "",
        description: fullProduct.description || "",
        ean: fullProduct.ean || "",
        has_ean: !fullProduct.ean,
        weight: fullProduct.weight ? String(fullProduct.weight) : "",
        width: fullProduct.width ? String(fullProduct.width) : "",
        height: fullProduct.height ? String(fullProduct.height) : "",
        depth: fullProduct.depth ? String(fullProduct.depth) : "",
        offerPrice: fullProduct.offer_price
          ? String(fullProduct.offer_price)
          : "",
        currency_code: fullProduct.currency_code || "ARG",
        percent_discount: fullProduct.percent_discount
          ? String(fullProduct.percent_discount)
          : "",
        wholesale: fullProduct.wholesale || false,
        offer_2x1: Boolean(fullProduct.offer_2x1),
        offer_3x2: Boolean(fullProduct.offer_3x2),
        wholesale_price: fullProduct.wholesale_price
          ? String(fullProduct.wholesale_price)
          : "",
        wholesale_unit: fullProduct.wholesale_unit
          ? String(fullProduct.wholesale_unit)
          : "",
        image: fullProduct.image || "",
      }));

      setFormPrice(
        fullProduct.price !== undefined ? String(fullProduct.price) : "",
      );
      const savedAttributes = Array.isArray(fullProduct.attributes)
        ? fullProduct.attributes
        : [];
      setAttributes(
        savedAttributes.length
          ? savedAttributes.map((attribute: ProductAttribute) => ({
              ...attribute,
            }))
          : [emptyAttribute()],
      );
      setInheritName(Boolean(fullProduct.inherit_parent_name));
      setInheritDescription(Boolean(fullProduct.inherit_parent_description));
      setInheritDimensions(Boolean(fullProduct.inherit_parent_dimensions));
      setFormStock(
        fullProduct.stock !== undefined ? String(fullProduct.stock) : "",
      );

      setInstallmentsEnabled(Boolean(fullProduct.installments_enabled));
      setMaxInstallments(normalizeMaxInstallments(fullProduct.max_installments));
      if (fullProduct.free_shipping !== undefined) {
        setFreeShipping(Boolean(fullProduct.free_shipping));
      }
      if (
        fullProduct.free_shipping_radius_km !== undefined &&
        fullProduct.free_shipping_radius_km !== null
      ) {
        setFreeShippingRadiusKm(String(fullProduct.free_shipping_radius_km));
      }
      if (
        fullProduct.free_shipping_min_amount !== undefined &&
        fullProduct.free_shipping_min_amount !== null
      ) {
        setFreeShippingMinAmount(String(fullProduct.free_shipping_min_amount));
      }
      if (
        fullProduct.free_shipping_max_weight !== undefined &&
        fullProduct.free_shipping_max_weight !== null
      ) {
        setFreeShippingMaxWeight(String(fullProduct.free_shipping_max_weight));
      }
      if (fullProduct.free_shipping_country !== undefined) {
        setFreeShippingCountry(Boolean(fullProduct.free_shipping_country));
      }
      setFreeShippingCountryMinAmount(
        String(
          fullProduct.free_shipping_country_min_amount ??
            (fullProduct.free_shipping_country ? 0 : ""),
        ),
      );
      const warrantyMonths = Number(fullProduct.warranty) || 0;
      setWarranty(warrantyMonths);
      setIsCustomWarranty(
        ![0, 1, 2, 3, 6, 12, 18, 24, 36, 48, 60].includes(warrantyMonths),
      );
      if (variantParent) {
        setInheritWarranty(
          warrantyMonths === Number(variantParent.warranty ?? 0),
        );
      }

      // Extract images
      let imgs: string[] = [];
      if (Array.isArray(fullProduct.Images) && fullProduct.Images.length > 0) {
        imgs = fullProduct.Images.map(
          (img: any) => img.image_url || img.url || "",
        ).filter(Boolean);
      } else if (
        Array.isArray(fullProduct.images) &&
        fullProduct.images.length > 0
      ) {
        imgs = fullProduct.images;
      } else if (fullProduct.image) {
        imgs = [fullProduct.image];
      } else if (typeof fullProduct.image_url === "string") {
        imgs = [fullProduct.image_url];
      }
      setImagePreviews(imgs);
      setImageFiles(imgs.map(() => null));

      // Extract videos
      let vids: string[] = [];
      if (Array.isArray(fullProduct.Videos) && fullProduct.Videos.length > 0) {
        vids = fullProduct.Videos.map(
          (v: any) => v.video_url || v.url || "",
        ).filter(Boolean);
      } else if (
        Array.isArray(fullProduct.videos) &&
        fullProduct.videos.length > 0
      ) {
        vids = fullProduct.videos
          .map((v: any) =>
            typeof v === "string" ? v : v.video_url || v.url || "",
          )
          .filter(Boolean);
      } else if (
        typeof fullProduct.video_url === "string" &&
        fullProduct.video_url
      ) {
        vids = [fullProduct.video_url];
      }
      setVideoPreviews(vids);
      setVideoFiles(vids.map(() => null));
    };

    loadFullProductData();

    return () => {
      isMounted = false;
    };
  }, [productToEdit, categories, variantParent, professionalId]);

  /* ── Image handlers ── */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    const croppedFiles = await Promise.all(
      incoming.map((file) => cropImageToSquare(file).catch(() => file)),
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

  /* ── Video handlers ── */
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    const slots = MAX_PRODUCT_VIDEOS - videoPreviews.length;
    if (slots <= 0) return;
    const toAdd = incoming.slice(0, slots);

    setVideoFiles((p) => [...p, ...toAdd]);
    Promise.all(
      toAdd.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onloadend = () => res((r.result as string) || "");
            r.readAsDataURL(f);
          }),
      ),
    ).then((results) =>
      setVideoPreviews((p) => [...p, ...results.filter(Boolean)]),
    );
    e.target.value = "";
  };

  const removeVideo = (i: number) => {
    setVideoFiles((p) => p.filter((_, idx) => idx !== i));
    setVideoPreviews((p) => p.filter((_, idx) => idx !== i));
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
    setEanWarranty(0);
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

  const handleAddFromEan = async () => {
    if (!eanMatch) return;
    if (
      freeShippingCountry &&
      (freeShippingCountryMinAmount.trim() === "" ||
        !Number.isFinite(Number(freeShippingCountryMinAmount)) ||
        Number(freeShippingCountryMinAmount) < 0)
    ) {
      showError("Ingresá un importe mínimo válido para el envío gratis nacional.");
      return;
    }
    try {
      if (eanMatch.isAlreadyAssigned && variantParent) {
        await commerceService.linkVariant(
          variantParent.professional_product_id,
          String(eanMatch.id),
        );
        queryClient.invalidateQueries({
          queryKey: ["product-family", variantParent.professional_product_id],
        });
        setShowSuccessModal(true);
        return;
      }
      await assignMutation.mutateAsync({
        professional_id: professionalId,
        product_id: String(eanMatch.id),
        price: Number(eanCustomPrice) || 0,
        sale_type: "unit",
        is_active: true,
        stock: Number(eanStock) || 0,
        offer_price: Number(eanOfferPrice) || 0,
        currency_code: eanCurrencyCode || "ARG",
        percent_discount: Number(eanPercentDiscount) || 0,
        wholesale: eanWholesale,
        offer_2x1: eanOfferType === "2x1",
        offer_3x2: eanOfferType === "3x2",
        wholesale_unit: eanWholesale
          ? Number(eanWholesaleUnit) || 0
          : undefined,
        wholesale_price: eanWholesale
          ? Number(eanWholesalePrice) || 0
          : undefined,
        free_shipping_country: freeShippingCountry,
        free_shipping_country_min_amount: freeShippingCountry
          ? Number(freeShippingCountryMinAmount) || 0
          : null,
        warranty: eanWarranty,
      });
    } catch (error: any) {
      showError(error?.message || "No se pudo vincular el producto.");
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const e: Record<string, string> = {};
      if (
        !(
          variantParent && inheritName ? variantParent.name : newProduct.name
        )?.trim()
      )
        e.name = "El nombre es obligatorio.";
      const normalizedAttributes = attributes.map((attribute) => ({
        name: attribute.name.trim(),
        value: attribute.value.trim(),
      }));
      if (
        normalizedAttributes.length === 0 ||
        normalizedAttributes.some(
          (attribute) => !attribute.name || !attribute.value,
        )
      ) {
        e.attributes =
          "Agregá al menos una característica y completá su valor.";
      } else if (
        new Set(
          normalizedAttributes.map((attribute) =>
            attribute.name.toLocaleLowerCase("es-AR"),
          ),
        ).size !== normalizedAttributes.length
      ) {
        e.attributes = "No repitas el nombre de una característica.";
      }
      if (!newProduct.has_ean && !newProduct.ean.trim())
        e.ean =
          "El EAN es obligatorio si no marcas la opción 'No tiene código de barra'.";
      if (!formPrice) e.price = "El precio es obligatorio.";
      if (
        freeShippingCountry &&
        (freeShippingCountryMinAmount.trim() === "" ||
          !Number.isFinite(Number(freeShippingCountryMinAmount)) ||
          Number(freeShippingCountryMinAmount) < 0)
      ) {
        e.freeShippingCountryMinAmount =
          "Ingresá un importe mínimo válido para el envío gratis nacional.";
      }
      if (!(variantParent?.categories_products_id || newProduct.categoryId))
        e.categoryId = "La categoría es obligatoria.";
      if (!formStock) e.stock = "El stock es obligatorio.";
      if (!newProduct.weight.trim()) e.weight = "El peso es obligatorio.";
      if (!newProduct.width.trim()) e.width = "El ancho es obligatorio.";
      if (!newProduct.height.trim()) e.height = "El alto es obligatorio.";
      if (!newProduct.depth.trim()) e.depth = "La profundidad es obligatoria.";
      if (imagePreviews.length === 0)
        e.image = "Debes subir al menos una imagen para el producto.";

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

      // Video uploads
      const token = getAccessToken();
      const videos_url: string[] = [];
      const videos_to_save: string[] = [];

      for (let i = 0; i < videoPreviews.length; i++) {
        const file = videoFiles[i];
        if (file) {
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
            const publicVideoUrl = uploadInfo?.key;
            videos_to_save.push(publicVideoUrl);
          }
        } else {
          videos_url.push(videoPreviews[i]);
        }
      }

      const attributeValue = (name: string) =>
        normalizedAttributes.find(
          (attribute) =>
            attribute.name.toLocaleLowerCase("es-AR") ===
            name.toLocaleLowerCase("es-AR"),
        )?.value;
      const sizeValue = attributeValue("Talle");
      const numericSize = Boolean(
        sizeValue && /^\d+(?:[.,]\d+)?$/.test(sizeValue),
      );

      const payload = {
        ean: newProduct.has_ean ? undefined : newProduct.ean,
        attributes: normalizedAttributes,
        color: attributeValue("Color") || null,
        size_letter: sizeValue && !numericSize ? sizeValue : null,
        size_number:
          sizeValue && numericSize ? Number(sizeValue.replace(",", ".")) : null,
        inherit_parent_name: Boolean(variantParent && inheritName),
        inherit_parent_description: Boolean(
          variantParent && inheritDescription,
        ),
        inherit_parent_dimensions: Boolean(variantParent && inheritDimensions),
        variant_parent_product_id:
          variantParent && !productToEdit
            ? variantParent.product_id
            : undefined,
        has_ean: newProduct.has_ean,
        weight: Number(
          variantParent && inheritDimensions
            ? variantParent.weight
            : newProduct.weight,
        ),
        width: Number(
          variantParent && inheritDimensions
            ? variantParent.width
            : newProduct.width,
        ),
        height: Number(
          variantParent && inheritDimensions
            ? variantParent.height
            : newProduct.height,
        ),
        depth: Number(
          variantParent && inheritDimensions
            ? variantParent.depth
            : newProduct.depth,
        ),
        name:
          variantParent && inheritName ? variantParent.name : newProduct.name,
        description:
          variantParent && inheritDescription
            ? variantParent.description || ""
            : newProduct.description,
        brand: newProduct.brand,
        image_url: images,
        videos_url: videos_url,
        videos_to_save: videos_to_save,
        display_order: images.map((_, i) => i + 1),
        categories_products_id:
          variantParent?.categories_products_id || newProduct.categoryId
            ? Number(
                variantParent?.categories_products_id || newProduct.categoryId,
              )
            : undefined,
        sub_categories_products_id: variantParent
          ? variantParent.sub_categories_products_id || null
          : newProduct.subcategoryId || undefined,
        professional_id: professionalId,
        price: Number(formPrice),
        sale_type: "unit",
        stock: Number(formStock),
        is_active: true,
        offer_price: Number(newProduct.offerPrice) || 0,
        currency_code: newProduct.currency_code || "ARG",
        percent_discount: Number(newProduct.percent_discount) || 0,
        wholesale: newProduct.wholesale,
        offer_2x1: newProduct.offer_2x1,
        offer_3x2: newProduct.offer_3x2,
        wholesale_price: Number(newProduct.wholesale_price) || 0,
        wholesale_unit: Number(newProduct.wholesale_unit) || 0,
        installments_enabled: !isFoodCategory && installmentsEnabled,
        max_installments:
          !isFoodCategory && installmentsEnabled
            ? normalizeMaxInstallments(maxInstallments)
            : 1,
        free_shipping: freeShipping,
        free_shipping_country: freeShippingCountry,
        free_shipping_country_min_amount: freeShippingCountry
          ? Number(freeShippingCountryMinAmount)
          : null,
        free_shipping_radius_km: freeShipping
          ? freeShippingRadiusKm
            ? Number(freeShippingRadiusKm)
            : null
          : null,
        free_shipping_min_amount: freeShipping
          ? freeShippingMinAmount
            ? Number(freeShippingMinAmount)
            : null
          : null,
        free_shipping_max_weight: freeShipping
          ? freeShippingMaxWeight
            ? Number(freeShippingMaxWeight)
            : null
          : null,
        warranty:
          variantParent && inheritWarranty
            ? variantParent.warranty != null
              ? Number(variantParent.warranty)
              : 0
            : Number(warranty) || 0,
      };

      if (productToEdit) {
        const productId = productToEdit.id || productToEdit.product_id;

        const originalUrls = productToEdit.images || [];
        const images_to_delete = originalUrls.filter(
          (url: string) => !payload.image_url.includes(url),
        );

        let originalVideoUrls: string[] = [];
        if (Array.isArray(productToEdit.videos)) {
          originalVideoUrls = productToEdit.videos
            .map((v: any) =>
              typeof v === "string" ? v : v.video_url || v.url || "",
            )
            .filter(Boolean);
        } else if (Array.isArray(productToEdit.Videos)) {
          originalVideoUrls = productToEdit.Videos.map(
            (v: any) => v.video_url || v.url || "",
          ).filter(Boolean);
        }
        const videos_to_delete = originalVideoUrls.filter(
          (url: string) => !videos_url.includes(url),
        );

        // 1. Update the base product
        await updateBaseMutation.mutateAsync({
          id: productId,
          ean: payload.ean,
          attributes: payload.attributes,
          color: payload.color,
          size_letter: payload.size_letter,
          size_number: payload.size_number,
          inherit_parent_name: payload.inherit_parent_name,
          inherit_parent_description: payload.inherit_parent_description,
          inherit_parent_dimensions: payload.inherit_parent_dimensions,
          name: payload.name,
          description: payload.description,
          brand: payload.brand,
          categories_products_id: payload.categories_products_id,
          sub_categories_products_id: payload.sub_categories_products_id,
          weight: payload.weight,
          width: payload.width,
          has_ean: payload.has_ean,
          height: payload.height,
          depth: payload.depth,
          images_url: images_url,
          images_to_save: images_to_save,
          images_to_delete: images_to_delete,
          videos_url: videos_url,
          videos_to_save: videos_to_save,
          videos_to_delete: videos_to_delete,
          display_order: payload.display_order,
        });

        // 2. Update the professional product relationship
        await updateMutation.mutateAsync({
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
            wholesale: payload.wholesale,
            offer_2x1: payload.offer_2x1,
            offer_3x2: payload.offer_3x2,
            wholesale_price: payload.wholesale_price,
            wholesale_unit: payload.wholesale_unit,
            installments_enabled: payload.installments_enabled,
            max_installments: payload.max_installments,
            free_shipping: payload.free_shipping,
            free_shipping_radius_km: payload.free_shipping_radius_km,
            free_shipping_min_amount: payload.free_shipping_min_amount,
            free_shipping_max_weight: payload.free_shipping_max_weight,
            free_shipping_country: payload.free_shipping_country,
            free_shipping_country_min_amount:
              payload.free_shipping_country_min_amount,
            warranty: payload.warranty,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...payload,
          image_url: payload.image_url[0] || "",
          images_url: payload.image_url,
          images_to_save: payload.image_url,
        });
      }
    } catch (err) {
      console.error("Error submitting product:", err);
      showError(
        err instanceof Error ? err.message : "No se pudo guardar el producto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (key: string, val: string | boolean) =>
    setNewProduct((p) => ({ ...p, [key]: val }));

  const currentPriceNumber = parseFloat(formPrice) || 0;
  const selectedInstallments = installmentsEnabled ? maxInstallments : 1;
  const commissionRate = commissionRates.find(
    (rate) => rate.installments === selectedInstallments,
  );
  const activeInstallmentRate =
    commissionRate?.effective_commission_pct ?? commissionRate?.commission_pct;
  const commissionAmount =
    activeInstallmentRate === undefined
      ? 0
      : Math.round(currentPriceNumber * activeInstallmentRate) / 100;
  const ivaRate = (commissionRate?.iva_pct ?? 21) / 100;
  const ivaOnCommission = Math.round(commissionAmount * ivaRate * 100) / 100;
  const totalDeduction =
    Math.round((commissionAmount + ivaOnCommission) * 100) / 100;
  const netEarnings =
    Math.round((currentPriceNumber - totalDeduction) * 100) / 100;

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
            {productToEdit
              ? variantParent
                ? "Modificar variante"
                : "Modificar Producto"
              : variantParent
                ? "Agregar variante"
                : "Agregar Producto"}
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
                    setEanWarranty(0);
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
                  <div className="product-creator__field">
                    <label htmlFor="ean-quantity-offer">
                      Promoción por cantidad
                    </label>
                    <select
                      id="ean-quantity-offer"
                      value={eanOfferType}
                      onChange={(event) => setEanOfferType(event.target.value)}
                    >
                      <option value="none">Sin promoción</option>
                      <option value="2x1">2x1</option>
                      <option value="3x2">3x2</option>
                    </select>
                  </div>
                  <div className="product-creator__field product-creator__field--full">
                    <label className="product-creator__wholesale-row">
                      <input
                        type="checkbox"
                        checked={freeShippingCountry}
                        onChange={(event) =>
                          setFreeShippingCountry(event.target.checked)
                        }
                      />
                      <span>Envíos gratis a todo el país</span>
                    </label>
                    {freeShippingCountry && (
                      <div className="product-creator__country-shipping-minimum">
                        <label htmlFor="ean-country-shipping-minimum">
                          Compra mínima fuera de la provincia ($)
                        </label>
                        <input
                          id="ean-country-shipping-minimum"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={freeShippingCountryMinAmount}
                          onChange={(event) =>
                            setFreeShippingCountryMinAmount(event.target.value)
                          }
                        />
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
                {(!eanMatch.isAlreadyAssigned || variantParent) && (
                  <button
                    data-action-tone="add"
                    className="product-creator__btn-save"
                    onClick={handleAddFromEan}
                    disabled={
                      isSaving ||
                      (!eanMatch.isAlreadyAssigned &&
                        (!eanCustomPrice ||
                          parseInt(eanCustomPrice) <= 0 ||
                          !eanStock))
                    }
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {isSaving
                      ? "Guardando..."
                      : eanMatch.isAlreadyAssigned
                        ? "Vincular como variante"
                        : "Agregar a mi catálogo"}
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
                  <label>
                    {variantParent
                      ? "Nombre de la variante *"
                      : "Nombre del producto *"}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Taladro Bosch 550W"
                    value={
                      variantParent && inheritName
                        ? variantParent.name || ""
                        : newProduct.name
                    }
                    disabled={Boolean(variantParent && inheritName)}
                    onChange={(e) => set("name", e.target.value)}
                  />
                  {errors.name && (
                    <span className="product-creator__error">
                      {errors.name}
                    </span>
                  )}
                </div>
                {variantParent && (
                  <label className="product-creator__inherit-option product-creator__field--full">
                    <input
                      type="checkbox"
                      checked={inheritName}
                      onChange={(event) => {
                        setInheritName(event.target.checked);
                        if (event.target.checked)
                          set("name", variantParent.name || "");
                      }}
                    />
                    Usar el nombre del producto principal
                  </label>
                )}

                <div className="product-creator__field">
                  <label>Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Bosch, Samsung..."
                    value={newProduct.brand}
                    onChange={(e) => set("brand", e.target.value)}
                  />
                </div>

                <div className="product-creator__field product-creator__field--full product-creator__attributes">
                  <div className="product-creator__attributes-heading">
                    <div>
                      <label>Características *</label>
                      <p>
                        Combiná las que necesites, por ejemplo Color: Rojo y
                        Almacenamiento: 256 GB.
                      </p>
                    </div>
                    <button
                      type="button"
                      data-action-tone="add"
                      className="product-creator__attribute-add"
                      onClick={() =>
                        setAttributes((current) => [
                          ...current,
                          emptyAttribute(),
                        ])
                      }
                    >
                      <Plus size={16} /> Agregar característica
                    </button>
                  </div>
                  <datalist id="product-creator-attribute-options">
                    {commonAttributes.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  {attributes.map((attribute, index) => (
                    <div className="product-creator__attribute-row" key={index}>
                      <div className="product-creator__field">
                        <label htmlFor={`product-attribute-name-${index}`}>
                          Característica {index + 1}
                        </label>
                        <input
                          id={`product-attribute-name-${index}`}
                          list="product-creator-attribute-options"
                          value={attribute.name}
                          placeholder="Ej: Color"
                          onChange={(event) =>
                            setAttributes((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="product-creator__field">
                        <label htmlFor={`product-attribute-value-${index}`}>
                          Valor
                        </label>
                        <input
                          id={`product-attribute-value-${index}`}
                          value={attribute.value}
                          placeholder="Ej: Rojo"
                          onChange={(event) =>
                            setAttributes((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, value: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="product-creator__attribute-remove"
                        aria-label={`Quitar característica ${index + 1}`}
                        disabled={attributes.length === 1}
                        onClick={() =>
                          setAttributes((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {errors.attributes && (
                    <span className="product-creator__error">
                      {errors.attributes}
                    </span>
                  )}
                </div>

                <div className="product-creator__field">
                  <label>Categoría *</label>
                  <select
                    value={newProduct.categoryId}
                    disabled={Boolean(variantParent)}
                    onChange={(e) => {
                      set("categoryId", e.target.value);
                      set("subcategoryId", "");
                    }}
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

                <div className="product-creator__field">
                  <label>Subcategoría (Opcional)</label>
                  <select
                    value={newProduct.subcategoryId}
                    disabled={Boolean(variantParent)}
                    onChange={(e) => set("subcategoryId", e.target.value)}
                    className="dash-products__modal-select"
                  >
                    <option value="">
                      {newProduct.categoryId
                        ? "Seleccionar subcategoría..."
                        : "Seleccioná primero una categoría"}
                    </option>
                    {subcategories.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {variantParent && (
                    <span className="product-creator__inherit-hint">
                      Se hereda del producto principal.
                    </span>
                  )}
                </div>

                {variantParent && (
                  <label className="product-creator__inherit-description">
                    <input
                      type="checkbox"
                      checked={inheritDescription}
                      onChange={(e) => {
                        setInheritDescription(e.target.checked);
                        if (e.target.checked)
                          set("description", variantParent.description || "");
                      }}
                    />
                    Heredar la descripción del producto principal
                  </label>
                )}
                <div className="product-creator__field product-creator__field--full">
                  <label>Descripción</label>
                  <textarea
                    rows={3}
                    placeholder="Describí las características del producto..."
                    value={
                      variantParent && inheritDescription
                        ? variantParent.description || ""
                        : newProduct.description
                    }
                    disabled={Boolean(variantParent && inheritDescription)}
                    onChange={(e) => set("description", e.target.value)}
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
              {variantParent && (
                <label className="product-creator__inherit-option">
                  <input
                    type="checkbox"
                    checked={inheritDimensions}
                    onChange={(event) => {
                      setInheritDimensions(event.target.checked);
                      if (event.target.checked)
                        setNewProduct((current) => ({
                          ...current,
                          weight:
                            variantParent.weight != null
                              ? String(variantParent.weight)
                              : "",
                          width:
                            variantParent.width != null
                              ? String(variantParent.width)
                              : "",
                          height:
                            variantParent.height != null
                              ? String(variantParent.height)
                              : "",
                          depth:
                            variantParent.depth != null
                              ? String(variantParent.depth)
                              : "",
                        }));
                    }}
                  />
                  Usar el peso y las dimensiones del producto principal
                </label>
              )}

              <div className="product-creator__grid">
                <div className="product-creator__field">
                  <label>Peso (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 1.5"
                    value={newProduct.weight}
                    disabled={Boolean(variantParent && inheritDimensions)}
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
                    disabled={Boolean(variantParent && inheritDimensions)}
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
                    disabled={Boolean(variantParent && inheritDimensions)}
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
                    disabled={Boolean(variantParent && inheritDimensions)}
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

                <div className="product-creator__field product-creator__field--full">
                  <label htmlFor="product-quantity-offer">
                    Promoción por cantidad
                  </label>
                  <select
                    id="product-quantity-offer"
                    value={
                      newProduct.offer_2x1
                        ? "2x1"
                        : newProduct.offer_3x2
                          ? "3x2"
                          : "none"
                    }
                    onChange={(event) =>
                      setNewProduct((current) => ({
                        ...current,
                        offer_2x1: event.target.value === "2x1",
                        offer_3x2: event.target.value === "3x2",
                      }))
                    }
                  >
                    <option value="none">Sin promoción</option>
                    <option value="2x1">2x1</option>
                    <option value="3x2">3x2</option>
                  </select>
                </div>

                {/* Cuotas sin interés */}
                <div className="product-creator__field product-creator__field--full">
                  <label className="product-creator__wholesale-row">
                    <input
                      type="checkbox"
                      checked={!isFoodCategory && installmentsEnabled}
                      disabled={isFoodCategory}
                      onChange={(e) => setInstallmentsEnabled(e.target.checked)}
                    />
                    <span>Habilitar cuotas sin interés para este producto</span>
                  </label>

                  {isFoodCategory ? (
                    <div className="product-creator__food-alert">
                      Por regulación comercial, los alimentos y perecederos no
                      admiten financiación en cuotas.
                    </div>
                  ) : (
                    <>
                      {installmentsEnabled && (
                        <div className="product-creator__installments-config">
                          <label className="product-creator__installments-label">
                            Máximo de cuotas permitidas
                          </label>
                          <select
                            value={maxInstallments}
                            onChange={(e) =>
                              setMaxInstallments(parseInt(e.target.value, 10))
                            }
                            className="dash-products__modal-select"
                          >
                            <option value={3}>Hasta 3 cuotas fijas</option>
                            <option value={6}>Hasta 6 cuotas fijas</option>
                            <option value={9}>Hasta 9 cuotas fijas</option>
                            <option value={12}>Hasta 12 cuotas fijas</option>
                            <option value={18}>Hasta 18 cuotas fijas</option>
                          </select>
                        </div>
                      )}

                      {/* Desglose de comisión de venta + 21% IVA */}
                      {currentPriceNumber > 0 &&
                        (commissionRate &&
                        activeInstallmentRate !== undefined ? (
                          <div className="product-creator__commission-box">
                            <div className="product-creator__commission-header">
                              <span className="product-creator__commission-title">
                                <Percent size={14} /> Desglose de retención y
                                liquidación
                              </span>
                              <span className="product-creator__commission-badge">
                                {installmentsEnabled
                                  ? `Hasta ${maxInstallments} cuotas (${activeInstallmentRate}% comisión)`
                                  : `1 pago (${activeInstallmentRate}% comisión)`}
                              </span>
                            </div>

                            <div className="product-creator__commission-rows">
                              <div className="product-creator__commission-row">
                                <span>Precio de venta al público:</span>
                                <strong>
                                  $
                                  {currentPriceNumber.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </strong>
                              </div>
                              <div className="product-creator__commission-row product-creator__commission-row--deduction">
                                <span>
                                  Comisión de plataforma (
                                  {activeInstallmentRate}
                                  %):
                                </span>
                                <strong>
                                  -$
                                  {commissionAmount.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </strong>
                              </div>
                              <div className="product-creator__commission-row product-creator__commission-row--deduction">
                                <span>
                                  IVA sobre comisión ({commissionRate.iva_pct}
                                  %):
                                </span>
                                <strong>
                                  -$
                                  {ivaOnCommission.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </strong>
                              </div>
                              <div className="product-creator__commission-row product-creator__commission-row--deduction">
                                <span>
                                  Total retención (
                                  {(
                                    activeInstallmentRate *
                                    (1 + ivaRate)
                                  ).toFixed(2)}
                                  %):
                                </span>
                                <strong>
                                  -$
                                  {totalDeduction.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </strong>
                              </div>
                              <div className="product-creator__commission-row product-creator__commission-row--total">
                                <span>
                                  {installmentsEnabled
                                    ? `Cobrarías neto si el comprador elige ${maxInstallments} cuotas:`
                                    : "Cobrarías neto en 1 pago:"}
                                </span>
                                <strong>
                                  $
                                  {netEarnings.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="product-creator__commission-unavailable"
                            role="status"
                          >
                            {commissionsLoading
                              ? "Consultando las comisiones vigentes..."
                              : commissionsError
                                ? "No se pudieron consultar las comisiones. Intentá nuevamente más tarde."
                                : "No hay una tasa vigente para la cantidad de cuotas seleccionada."}
                          </p>
                        ))}
                    </>
                  )}
                </div>

                {/* Envío gratis */}
                <div className="product-creator__field product-creator__field--full">
                  <label className="product-creator__wholesale-row">
                    <input
                      type="checkbox"
                      checked={freeShipping}
                      onChange={(e) => setFreeShipping(e.target.checked)}
                    />
                    <span>Ofrecer envío gratis en este producto</span>
                  </label>

                  {freeShipping && (
                    <div className="product-creator__shipping-box">
                      {shippingPolicy?.has_own_riders ? (
                        <div className="product-creator__shipping-notice product-creator__shipping-notice--own-riders">
                          <Truck size={18} />
                          <div>
                            <strong>Flota propia de riders:</strong> Al contar
                            con logística independiente, la plataforma no
                            descontará costo de envío por las ventas de este
                            producto.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="product-creator__shipping-notice product-creator__shipping-notice--platform">
                            <Truck size={18} />
                            <div>
                              <strong>Envíos con la plataforma:</strong>{" "}
                              Configura las condiciones bajo las cuales
                              absorberás el costo del envío para el comprador:
                            </div>
                          </div>

                          <div className="product-creator__shipping-grid">
                            <div className="product-creator__field">
                              <label>Radio cobertura (km)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="Ej: 5 (opcional)"
                                value={freeShippingRadiusKm}
                                onChange={(e) =>
                                  setFreeShippingRadiusKm(e.target.value)
                                }
                              />
                            </div>
                            <div className="product-creator__field">
                              <label>Compra mínima ($)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Ej: 15000 (opcional)"
                                value={freeShippingMinAmount}
                                onChange={(e) =>
                                  setFreeShippingMinAmount(e.target.value)
                                }
                              />
                            </div>
                            <div className="product-creator__field">
                              <label>Peso máx. (kg)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="Ej: 5 (opcional)"
                                value={freeShippingMaxWeight}
                                onChange={(e) =>
                                  setFreeShippingMaxWeight(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Envío gratis a todo el país */}
                <div className="product-creator__field product-creator__field--full">
                  <button
                    type="button"
                    className={`product-creator__country-shipping-btn ${
                      freeShippingCountry
                        ? "product-creator__country-shipping-btn--active"
                        : ""
                    }`}
                    onClick={() => setFreeShippingCountry((prev) => !prev)}
                  >
                    <Car size={18} />
                    <span>Envíos Gratis a todo el País</span>
                    <span className="product-creator__country-shipping-status">
                      {freeShippingCountry ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </button>
                  {freeShippingCountry && (
                    <div className="product-creator__country-shipping-minimum">
                      <label htmlFor="product-country-shipping-minimum">
                        Compra mínima para envíos gratis fuera de la provincia ($)
                      </label>
                      <input
                        id="product-country-shipping-minimum"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={freeShippingCountryMinAmount}
                        onChange={(event) =>
                          setFreeShippingCountryMinAmount(event.target.value)
                        }
                      />
                      {errors.freeShippingCountryMinAmount && (
                        <span className="product-creator__error">
                          {errors.freeShippingCountryMinAmount}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Garantía */}
                <div className="product-creator__field product-creator__field--full">
                  <label htmlFor="product-warranty">
                    Garantía del producto
                  </label>
                  {variantParent && (
                    <label className="product-creator__inherit-option product-creator__inherit-option--warranty">
                      <input
                        type="checkbox"
                        checked={inheritWarranty}
                        onChange={(e) => {
                          setInheritWarranty(e.target.checked);
                          if (
                            e.target.checked &&
                            variantParent.warranty !== undefined
                          ) {
                            const parentW = Number(variantParent.warranty || 0);
                            setWarranty(parentW);
                            setIsCustomWarranty(
                              ![0, 1, 2, 3, 6, 12, 18, 24, 36, 48, 60].includes(
                                parentW,
                              ),
                            );
                          }
                        }}
                      />
                      <span>
                        Heredar la garantía del producto principal (
                        {variantParent.warranty &&
                        Number(variantParent.warranty) > 0
                          ? Number(variantParent.warranty) % 12 === 0 &&
                            Number(variantParent.warranty) >= 12
                            ? `${Number(variantParent.warranty) / 12} ${Number(variantParent.warranty) / 12 === 1 ? "año" : "años"}`
                            : `${variantParent.warranty} ${Number(variantParent.warranty) === 1 ? "mes" : "meses"}`
                          : "Sin garantía"}
                        )
                      </span>
                    </label>
                  )}
                  <select
                    id="product-warranty"
                    value={isCustomWarranty ? "custom" : warranty}
                    disabled={Boolean(variantParent && inheritWarranty)}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomWarranty(true);
                      } else {
                        setIsCustomWarranty(false);
                        setWarranty(Number(e.target.value));
                      }
                    }}
                    className="dash-products__modal-select"
                  >
                    <option value={0}>Sin garantía (0 meses)</option>
                    {[1, 2, 3, 6, 12, 18, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={m}>
                        {m === 1 ? "1 mes" : `${m} meses`}
                        {m === 12
                          ? " (1 año)"
                          : m === 24
                            ? " (2 años)"
                            : m === 36
                              ? " (3 años)"
                              : ""}
                      </option>
                    ))}
                    <option value="custom">
                      Otro plazo (personalizado)...
                    </option>
                  </select>
                  {isCustomWarranty && !(variantParent && inheritWarranty) && (
                    <div style={{ marginTop: "10px" }}>
                      <label
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Cantidad de meses de garantía:
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 9"
                        value={warranty}
                        onChange={(e) =>
                          setWarranty(
                            Math.max(0, parseInt(e.target.value, 10) || 0),
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Variantes de producto */}
                {!variantParent && (
                  <div className="product-creator__field product-creator__field--full">
                    <label className="product-creator__installments-label">
                      Variantes y Atributos (Color, Talle, Precios y Stock)
                    </label>
                    <button
                      type="button"
                      className="btn-secondary product-creator__variants-trigger"
                      onClick={() => {
                        const productId =
                          productToEdit?.professional_product_id;
                        if (productId) {
                          router.push(
                            `/panel?view=products-variants&productId=${productId}`,
                          );
                        } else {
                          showError(
                            "Primero debes guardar el producto para poder gestionar sus variantes.",
                          );
                        }
                      }}
                    >
                      <Layers size={16} />
                      <span>Gestionar variantes de producto</span>
                    </button>
                  </div>
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
                Imágenes ({imagePreviews.length})
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

              <label
                data-action-tone="upload"
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
                <span>Subir fotos</span>
              </label>
              {errors.image && (
                <span
                  className="product-creator__error"
                  style={{ display: "block", marginTop: "8px" }}
                >
                  {errors.image}
                </span>
              )}

              <p className="product-creator__images-hint">
                Sin límite de imágenes. Arrastrá para reordenar. La primera es
                la imagen principal.
              </p>
            </div>

            {/* ── Sección 5: Videos ── */}
            <div className="product-creator__section">
              <p className="product-creator__section-title">
                <Video
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                Videos ({videoPreviews.length}/{MAX_PRODUCT_VIDEOS})
              </p>

              <div className="product-creator__videos-grid">
                {videoPreviews.map((preview, idx) => (
                  <div
                    key={`video-${idx}`}
                    className="product-creator__video-card"
                  >
                    <video src={preview} controls preload="metadata" />
                    <button
                      type="button"
                      className="product-creator__video-remove"
                      onClick={() => removeVideo(idx)}
                      title="Eliminar video"
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="product-creator__video-badge">
                      Video {idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {videoPreviews.length < MAX_PRODUCT_VIDEOS && (
                <label
                  data-action-tone="upload"
                  className="dash-products__image-upload"
                  style={{ marginTop: "24px" }}
                >
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    multiple
                    onChange={handleVideoChange}
                    disabled={isSaving}
                  />
                  <Film size={24} className="icon-blue" />
                  <span>Subir video (máx. 2)</span>
                </label>
              )}
              <p className="product-creator__images-hint">
                Podés subir hasta 2 videos por producto (formatos mp4, webm,
                mov).
              </p>
            </div>

            {/* ── Footer ── */}
            <div className="product-creator__footer">
              <button
                data-action-tone="cancel"
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
                    <Check size={16} />{" "}
                    {variantParent ? "Guardar variante" : "Guardar producto"}
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
            <h3>
              ¡{variantParent ? "Variante" : "Producto"} guardado exitosamente!
            </h3>
            <p>
              {variantParent
                ? "La variante quedó vinculada al producto principal."
                : "El producto se ha registrado correctamente en tu catálogo."}
            </p>
            <button
              type="button"
              className="dash-products__modal-apply"
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
            >
              {variantParent ? "Volver a variantes" : "Volver al catálogo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
