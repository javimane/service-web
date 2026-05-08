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
  ChevronLeft,
  ChevronRight,
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
  Filter,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { productService } from "../../../services/productService";
import { categoriesProductService } from "../../../services/categoriesProduct";
import { uploadProductImage } from "../../../services/storageUploads";
import "./DashboardProducts.css";

const MAX_PRODUCT_IMAGES = 4;

const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

const normalizeImageUrls = (imageUrls: unknown, fallback?: string) => {
  if (Array.isArray(imageUrls)) {
    const clean = imageUrls
      .map((url) => String(url || "").trim())
      .filter(Boolean);
    if (clean.length > 0) return clean;
  }

  if (typeof imageUrls === "string" && imageUrls.trim()) {
    const raw = imageUrls.trim();
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed
            .map((url) => String(url || "").trim())
            .filter(Boolean);
          if (clean.length > 0) return clean;
        }
      } catch {
        // ignore invalid JSON and fallback to plain string handling
      }
    }

    if (raw.includes(",")) {
      const split = raw
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      if (split.length > 0) return split;
    }

    return [raw];
  }

  if (fallback?.trim()) return [fallback.trim()];
  return [];
};

const normalizeDisplayOrder = (displayOrder: unknown) => {
  if (Array.isArray(displayOrder)) {
    const clean = displayOrder
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0);
    if (clean.length > 0) return clean;
  }

  if (typeof displayOrder === "string" && displayOrder.trim()) {
    const raw = displayOrder.trim();
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value >= 0);
          if (clean.length > 0) return clean;
        }
      } catch {
        // ignore invalid JSON and fallback to plain string handling
      }
    }

    if (raw.includes(",")) {
      const split = raw
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value >= 0);
      if (split.length > 0) return split;
    }
  }

  return [];
};

const getOrderedProductImages = (
  imageUrls: unknown,
  displayOrder: unknown,
  fallback?: string,
) => {
  const images = normalizeImageUrls(imageUrls, fallback);
  if (images.length <= 1) return images;

  const order = normalizeDisplayOrder(displayOrder);
  if (order.length !== images.length) return images;

  return images
    .map((url, index) => ({
      url,
      order: order[index] ?? index + 1,
      originalIndex: index,
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map((item) => item.url);
};

const moveArrayItem = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

type EditImageItem =
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string };

export default function DashboardProducts() {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [searchQuery, setSearchQuery] = useState("");
  const [eanSearchQuery, setEanSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  // Bulk price modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("percent"); // "percent" | "fixed"
  const [bulkValue, setBulkValue] = useState("");
  const [bulkAction, setBulkAction] = useState("increase"); // "increase" | "decrease"
  const [bulkDeleteOffers, setBulkDeleteOffers] = useState(false);
  const [bulkApplied, setBulkApplied] = useState(false);

  // Add product modal
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    price: "",
    categoryId: "",
    stock: "",
    image: "",
    description: "",
    ean: "",
    webUrl: "",
    offerPrice: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggingNewImageIndex, setDraggingNewImageIndex] = useState<
    number | null
  >(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  // Edit product modal
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<{
    id: number;
    name: string;
    brand: string;
    price: string;
    categoryId: string;
    stock: string;
    image: string;
    description: string;
    ean: string;
    webUrl: string;
    offerPrice: string;
    images: string[];
  } | null>(null);
  const [editImageItems, setEditImageItems] = useState<EditImageItem[]>([]);
  const [editOriginalImageUrls, setEditOriginalImageUrls] = useState<string[]>(
    [],
  );
  const [draggingEditImageIndex, setDraggingEditImageIndex] = useState<
    number | null
  >(null);

  // Queries & Mutations
  const { data: productsData = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["professional-products", professionalId],
    queryFn: () => productService.getByProfessional(professionalId),
    enabled: !!professionalId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-products"],
    queryFn: categoriesProductService.listCategoriesProducts,
  });

  // Map API data to component structure
  const productsList = useMemo(() => {
    return productsData.map((item: any) => ({
      images: Array.isArray(item.Product?.Images)
        ? [...item.Product.Images]
            .sort(
              (a: any, b: any) =>
                Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0),
            )
            .map((img: any) => String(img?.image_url || "").trim())
            .filter(Boolean)
        : getOrderedProductImages(
            item.Product?.image_urls,
            item.Product?.display_order ?? item.display_order,
            item.Product?.image_url,
          ),
      id: item.product_id,
      name: item.Product?.name || "Sin nombre",
      price: item.price,
      offer_price: item.offer_price || 0,
      originalPrice: item.price,
      brand: item.Product?.brand || "",
      category: (
        item.Product?.CategoryProduct?.name ||
        item.Product?.category?.name ||
        "General"
      ).trim(),
      stock: item.stock || 0,
      image: Array.isArray(item.Product?.Images)
        ? [...item.Product.Images]
            .sort(
              (a: any, b: any) =>
                Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0),
            )
            .map((img: any) => String(img?.image_url || "").trim())
            .find(Boolean) || ""
        : getOrderedProductImages(
            item.Product?.image_urls,
            item.Product?.display_order ?? item.display_order,
            item.Product?.image_url,
          )[0] || "",
      description: item.Product?.description || "",
      ean: item.Product?.ean || "",
      sale_type: item.sale_type,
      is_active: item.is_active,
    }));
  }, [productsData]);

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setAddOpen(false);
      setShowSuccessModal(true);
    },
  });

  const assignMutation = useMutation({
    mutationFn: productService.assignToProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-products"] });
      setAddOpen(false);
      setShowSuccessModal(true);
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
        setBulkDeleteOffers(false);
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
  const [eanStock, setEanStock] = useState("");
  const [eanOfferPrice, setEanOfferPrice] = useState("");

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
    let list = productsList.filter((p) => {
      const matchesName = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesEan = p.ean
        .toLowerCase()
        .includes(eanSearchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "" || p.category.trim() === categoryFilter.trim();
      return matchesName && matchesEan && matchesCategory;
    });
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
  }, [
    productsList,
    searchQuery,
    eanSearchQuery,
    categoryFilter,
    sortField,
    sortDir,
  ]);

  // Stats
  const totalProducts = productsList.length;
  const totalStock = productsList.reduce((s, p) => s + (p.stock || 0), 0);
  const avgPrice =
    productsList.length > 0
      ? productsList.reduce(
          (s, p) => s + (p.offer_price > 0 ? p.offer_price : p.price),
          0,
        ) / productsList.length
      : 0;

  // Bulk price apply
  const handleBulkApply = () => {
    const val = parseFloat(bulkValue);
    if ((isNaN(val) || val <= 0) && !bulkDeleteOffers) return;

    massUpdateMutation.mutate({
      professionalId,
      type: bulkMode as any,
      value: isNaN(val) ? 0 : val,
      operation: bulkAction === "increase" ? "add" : "subtract",
      delete_offer_price: bulkDeleteOffers,
    });
  };

  // Image file handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    const availableSlots = MAX_PRODUCT_IMAGES - imageFiles.length;
    if (availableSlots <= 0) return;

    const filesToAdd = incomingFiles.slice(0, availableSlots);
    setImageFiles((prev) => [...prev, ...filesToAdd]);

    const readers = filesToAdd.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || "");
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((results) => {
      setImagePreviews((prev) => [...prev, ...results.filter(Boolean)]);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const moveNewImage = (from: number, to: number) => {
    setImageFiles((prev) => moveArrayItem(prev, from, to));
    setImagePreviews((prev) => moveArrayItem(prev, from, to));
  };

  const handleNewImageDrop = (targetIndex: number) => {
    if (draggingNewImageIndex === null) return;
    if (draggingNewImageIndex !== targetIndex) {
      moveNewImage(draggingNewImageIndex, targetIndex);
    }
    setDraggingNewImageIndex(null);
  };

  // EAN check against DB
  const handleCheckEan = async () => {
    const ean = newProduct.ean.trim();
    if (!ean) return;
    setEanLoading(true);
    setEanMatch(null);
    try {
      const match = await productService.getByEan(ean, professionalId);

      if (match) {
        setEanMatch({
          id: match.Product?.id || match.product_id,
          title: match.Product?.name || "Sin nombre",
          price: match.price || 0,
          offer_price: match.offer_price || 0,
          image: match.Product?.image_url || "",
          category:
            match.Product?.CategoryProduct?.name ||
            (match.Product as any)?.category?.name ||
            "General",
          isAlreadyAssigned: (match as any).is_already_assigned,
        });
        setEanPriceMode("custom");
        setEanCustomPrice("");
        setEanStock("");
        setEanOfferPrice("");
      } else {
        setEanMatch(null);
      }
    } catch (error) {
      console.error("Error checking EAN:", error);
    }
    setEanLoading(false);
  };

  const handleEditCheckEan = async () => {
    if (!editProduct?.ean.trim()) return;
    setEanLoading(true);
    try {
      const response = await productService.list({
        ean: editProduct.ean.trim(),
      });
      const match = response.data[0];

      if (match) {
        const matchedImages = Array.isArray((match.Product as any)?.Images)
          ? [...(match.Product as any).Images]
              .sort(
                (a: any, b: any) =>
                  Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0),
              )
              .map((img: any) => String(img?.image_url || "").trim())
              .filter(Boolean)
          : getOrderedProductImages(
              (match.Product as any)?.image_urls,
              (match.Product as any)?.display_order,
              match.Product?.image_url,
            );

        setEditProduct({
          ...editProduct,
          name: match.Product?.name || editProduct.name,
          brand: match.Product?.brand || editProduct.brand,
          categoryId: match.Product?.categories_products_id
            ? String(match.Product.categories_products_id)
            : editProduct.categoryId,
          image: match.Product?.image_url || editProduct.image,
          description: match.Product?.description || editProduct.description,
          images: matchedImages.length > 0 ? matchedImages : editProduct.images,
        });
        const nextImages =
          matchedImages.length > 0 ? matchedImages : editProduct.images;
        setEditImageItems(nextImages.map((url) => ({ type: "existing", url })));
        setEditOriginalImageUrls(nextImages);
      }
    } catch (error) {
      console.error("Error checking EAN in edit:", error);
    }
    setEanLoading(false);
  };

  // Add existing product from EAN match
  const handleAddFromEan = () => {
    if (!eanMatch) return;
    const finalPrice = Number(eanCustomPrice) || 0;
    const finalOfferPrice = Number(eanOfferPrice) || 0;
    const finalStock = Number(eanStock) || 0;

    assignMutation.mutate({
      professional_id: professionalId,
      product_id: String(eanMatch.id),
      price: finalPrice,
      sale_type: "unit",
      is_active: true,
      stock: finalStock,
      offer_price: finalOfferPrice,
    });
  };

  // Reset add modal state
  const clearForm = () => {
    setNewProduct({
      name: "",
      brand: "",
      price: "",
      categoryId: "",
      stock: "",
      image: "",
      description: "",
      ean: "",
      webUrl: "",
      offerPrice: "",
    });
    setFormPrice("");
    setFormStock("");
    setImageFiles([]);
    setImagePreviews([]);
    setEanMatch(null);
    setEanLoading(false);
    setEanCustomPrice("");
  };

  const resetAddModal = () => {
    clearForm();
    setAddOpen(false);
  };

  // Add product
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !formPrice) return;

    const uploadedImageUrls: string[] = [];

    for (const file of imageFiles) {
      const uploaded = await uploadProductImage({
        file,
        entityId: newProduct.name,
      });
      uploadedImageUrls.push(uploaded.publicUrl);
    }

    const fallbackImages =
      uploadedImageUrls.length > 0
        ? uploadedImageUrls
        : newProduct.image
          ? [newProduct.image]
          : [];

    createMutation.mutate({
      ean: newProduct.ean,
      name: newProduct.name,
      description: newProduct.description,
      brand: newProduct.brand,
      image_url: fallbackImages,
      display_order: fallbackImages.map((_, index) => index + 1),
      categories_products_id: newProduct.categoryId
        ? Number(newProduct.categoryId)
        : undefined,
      // Professional relationship data (sent in same request)
      professional_id: professionalId,
      price: Number(formPrice),
      sale_type: "unit",
      stock: Number(formStock),
      is_active: true,
      offer_price: Number(newProduct.offerPrice) || 0,
    });
  };

  // Open edit modal
  const openEditModal = (product: any) => {
    // Find category ID from category name if possible, or adjust based on API response
    const categoryMatch = categories.find((c) => c.name === product.category);

    setEditProduct({
      id: product.id,
      name: product.name,
      brand: product.brand || "",
      price: String(product.price),
      categoryId: categoryMatch ? String(categoryMatch.id) : "",
      stock: String(product.stock || 0),
      image: product.image || "",
      description: product.description || "",
      ean: product.ean || "",
      webUrl: "",
      offerPrice: String(product.offer_price || ""),
      images: product.images || (product.image ? [product.image] : []),
    });
    const initialImages: string[] = getOrderedProductImages(
      product.images,
      product.display_order,
      product.image,
    );
    setEditImageItems(initialImages.map((url) => ({ type: "existing", url })));
    setEditOriginalImageUrls(initialImages);
    setEditOpen(true);
  };

  // Edit image handler
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editProduct) return;

    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    const usedSlots = editImageItems.length;
    const availableSlots = MAX_PRODUCT_IMAGES - usedSlots;
    if (availableSlots <= 0) return;

    const filesToAdd = incomingFiles.slice(0, availableSlots);

    const readers = filesToAdd.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || "");
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((results) => {
      const newItems: EditImageItem[] = filesToAdd.map((file, index) => ({
        type: "new",
        file,
        preview: results[index] || "",
      }));
      setEditImageItems((prev) => [...prev, ...newItems]);
    });

    e.target.value = "";
  };

  const removeEditImageItem = (index: number) => {
    setEditImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveEditImageItem = (from: number, to: number) => {
    setEditImageItems((prev) => moveArrayItem(prev, from, to));
  };

  const handleEditImageDrop = (targetIndex: number) => {
    if (draggingEditImageIndex === null) return;
    if (draggingEditImageIndex !== targetIndex) {
      moveEditImageItem(draggingEditImageIndex, targetIndex);
    }
    setDraggingEditImageIndex(null);
  };

  // Save edited product
  const handleEditProduct = async () => {
    if (!editProduct || !editProduct.name.trim() || !editProduct.price) return;

    const finalImages: string[] = [];

    for (const item of editImageItems.slice(0, MAX_PRODUCT_IMAGES)) {
      if (item.type === "existing") {
        finalImages.push(item.url);
        continue;
      }

      const uploaded = await uploadProductImage({
        file: item.file,
        entityId: editProduct.name,
      });
      finalImages.push(uploaded.publicUrl);
    }

    const imagesToDelete = editOriginalImageUrls.filter(
      (url) => !finalImages.includes(url),
    );

    updateMutation.mutate({
      productId: String(editProduct.id),
      data: {
        price: Number(editProduct.price),
        stock: Number(editProduct.stock),
        offer_price: Number(editProduct.offerPrice) || 0,
        image_url: finalImages,
        images_to_save: finalImages,
        images_to_delete: imagesToDelete,
        display_order: finalImages.map((_, index) => index + 1),
      },
    });
  };

  const resetEditModal = () => {
    setEditProduct(null);
    setEditImageItems([]);
    setEditOriginalImageUrls([]);
    setEditOpen(false);
  };

  // Delete product (Unassign)
  const handleDelete = (product: any) => {
    setProductToDelete({ id: product.id, name: product.name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      unassignMutation.mutate(String(productToDelete.id));
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
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
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="dash-products__search">
          <Barcode size={16} />
          <input
            type="text"
            placeholder="Buscar por EAN..."
            value={eanSearchQuery}
            onChange={(e) => setEanSearchQuery(e.target.value)}
          />
        </div>
        <div className="dash-products__search">
          <Filter size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="dash-products__category-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name.trim()}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            className="dash-products__search-btn"
            onClick={() => {
              /* Reactive filtering is already active */
            }}
            title="Aplicar filtro de categoría"
          >
            <Search size={14} />
          </button>
        </div>
        {(searchQuery || eanSearchQuery || categoryFilter) && (
          <button
            className="dash-products__clear-filters"
            onClick={() => {
              setSearchQuery("");
              setEanSearchQuery("");
              setCategoryFilter("");
            }}
            title="Limpiar todos los filtros"
          >
            <X size={14} />
            <span>Limpiar</span>
          </button>
        )}
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
                      <div className="dash-products__thumb-stack">
                        <img
                          src={product.image}
                          alt=""
                          className="dash-products__thumb"
                        />
                        {(product.images?.length || 0) > 1 && (
                          <span className="dash-products__thumb-count">
                            +{product.images.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="dash-products__thumb-placeholder">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="dash-products__product-name">
                      {product.name}
                    </span>
                  </td>
                  <td>
                    <span className="dash-products__badge">
                      {product.category}
                    </span>
                  </td>
                  <td className="dash-products__cell-right">
                    <div className="dash-products__price-container">
                      <span
                        className={`dash-products__price ${product.offer_price > 0 ? "dash-products__price--offer" : ""}`}
                      >
                        {formatPrice(
                          product.offer_price > 0
                            ? product.offer_price
                            : product.price,
                        )}
                      </span>
                      {product.offer_price > 0 && (
                        <span className="dash-products__price-original">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
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
                        onClick={() => handleDelete(product)}
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

            {/* Delete offers option */}
            <div
              className="dash-products__modal-field"
              style={{ marginTop: "4px" }}
            >
              <label className="dash-products__checkbox-label">
                <input
                  type="checkbox"
                  checked={bulkDeleteOffers}
                  onChange={(e) => setBulkDeleteOffers(e.target.checked)}
                />
                <span>Eliminar todos los precios de oferta</span>
              </label>
            </div>

            {/* Preview */}
            {(bulkDeleteOffers || (bulkValue && parseFloat(bulkValue) > 0)) && (
              <div className="dash-products__modal-preview">
                <AlertTriangle size={14} />
                <span>
                  {bulkDeleteOffers &&
                  (!bulkValue || parseFloat(bulkValue) <= 0) ? (
                    <>
                      Se eliminará el <strong>precio de oferta</strong> de todos
                      los productos.
                    </>
                  ) : (
                    <>
                      Esto{" "}
                      {bulkAction === "increase" ? "aumentará" : "disminuirá"}{" "}
                      el precio de{" "}
                      <strong>{productsList.length} productos</strong>{" "}
                      {bulkMode === "percent"
                        ? `en un ${bulkValue}%`
                        : `en ${formatPrice(parseFloat(bulkValue))}`}
                      {bulkDeleteOffers &&
                        " y se eliminarán sus precios de oferta."}
                    </>
                  )}
                </span>
              </div>
            )}

            <button
              className={`dash-products__modal-apply ${bulkApplied ? "dash-products__modal-apply--done" : ""}`}
              onClick={handleBulkApply}
              disabled={
                (!bulkDeleteOffers &&
                  (!bulkValue || parseFloat(bulkValue) <= 0)) ||
                bulkApplied
              }
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
                <div
                  className="dash-products__ean-match-header"
                  style={{
                    backgroundColor: eanMatch.isAlreadyAssigned
                      ? "rgba(22, 163, 74, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                    color: eanMatch.isAlreadyAssigned ? "#16a34a" : "#3b82f6",
                    marginBottom: "20px",
                  }}
                >
                  {eanMatch.isAlreadyAssigned ? (
                    <Check size={16} />
                  ) : (
                    <Info size={16} />
                  )}
                  <span>
                    {eanMatch.isAlreadyAssigned
                      ? "Este producto ya se encuentra en tu catálogo."
                      : "Este producto ya existe. Deberá asociarlo a su catálogo."}
                  </span>
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
                    <div
                      className="dash-products__price-container"
                      style={{ alignItems: "flex-start" }}
                    >
                      <span
                        className={`dash-products__ean-match-price ${eanMatch.offer_price > 0 ? "dash-products__price--offer" : ""}`}
                      >
                        {formatPrice(
                          eanMatch.offer_price > 0
                            ? eanMatch.offer_price
                            : eanMatch.price,
                        )}
                      </span>
                      {eanMatch.offer_price > 0 && (
                        <span className="dash-products__price-original">
                          {formatPrice(eanMatch.price)}
                        </span>
                      )}
                    </div>
                    {eanMatch.category && (
                      <span className="dash-products__ean-match-cat">
                        {eanMatch.category}
                      </span>
                    )}
                  </div>
                </div>

                {!eanMatch.isAlreadyAssigned && (
                  <div
                    className="dash-products__form-grid"
                    style={{ marginTop: "20px" }}
                  >
                    <div className="dash-products__modal-field">
                      <label>Precio (ARS) *</label>
                      <div className="dash-products__modal-input-wrap">
                        <DollarSign size={16} />
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={eanCustomPrice}
                          onChange={(e) => setEanCustomPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="dash-products__modal-field">
                      <label>Precio Oferta (ARS)</label>
                      <div className="dash-products__modal-input-wrap">
                        <DollarSign size={16} />
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={eanOfferPrice}
                          onChange={(e) => setEanOfferPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="dash-products__modal-field">
                      <label>Stock disponible</label>
                      <div className="dash-products__modal-input-wrap">
                        <Package size={16} />
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={eanStock}
                          onChange={(e) => setEanStock(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="dash-products__modal-footer">
                  <button
                    className="dash-products__modal-cancel"
                    onClick={() => setEanMatch(null)}
                  >
                    {eanMatch.isAlreadyAssigned ? "Cerrar" : "Crear nuevo"}
                  </button>
                  {!eanMatch.isAlreadyAssigned && (
                    <button
                      className="dash-products__modal-apply"
                      onClick={handleAddFromEan}
                      disabled={
                        !eanCustomPrice || parseInt(eanCustomPrice) <= 0
                      }
                    >
                      Agregar a mi cuenta
                    </button>
                  )}
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
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="dash-products__modal-field">
                    <label>Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Bosch, Samsung..."
                      value={newProduct.brand}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, brand: e.target.value })
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
                    <label>Precio de Oferta (ARS)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newProduct.offerPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          offerPrice: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="dash-products__modal-field">
                    <label>Categoría</label>
                    <select
                      value={newProduct.categoryId}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          categoryId: e.target.value,
                        })
                      }
                      className="dash-products__modal-select"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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
                    {imagePreviews.length > 0 && (
                      <p className="dash-products__images-order-hint">
                        Ordená las imágenes arrastrando o con las flechas. La
                        primera será la principal.
                      </p>
                    )}
                    <label className="dash-products__image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        hidden
                        disabled={imageFiles.length >= MAX_PRODUCT_IMAGES}
                      />
                      <Upload size={20} />
                      <span>
                        {imageFiles.length >= MAX_PRODUCT_IMAGES
                          ? "Límite alcanzado"
                          : "Subir imágenes"}
                      </span>
                      <span className="dash-products__image-upload-hint">
                        JPG, PNG o WebP (máx. 5MB c/u). Hasta 4 imágenes.
                      </span>
                    </label>

                    {imagePreviews.length > 0 && (
                      <div className="dash-products__image-preview-grid">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className={`dash-products__image-preview ${draggingNewImageIndex === index ? "dash-products__image-preview--dragging" : ""}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              setDraggingNewImageIndex(index);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleNewImageDrop(index)}
                            onDragEnd={() => setDraggingNewImageIndex(null)}
                          >
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <button
                              className="dash-products__image-remove"
                              onClick={() => removeImage(index)}
                              type="button"
                            >
                              <X size={14} />
                            </button>
                            <div className="dash-products__image-order-controls">
                              <button
                                className="dash-products__image-order-btn"
                                onClick={() => moveNewImage(index, index - 1)}
                                type="button"
                                disabled={index === 0}
                                aria-label="Mover imagen a la izquierda"
                                title="Mover a la izquierda"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <button
                                className="dash-products__image-order-btn"
                                onClick={() => moveNewImage(index, index + 1)}
                                type="button"
                                disabled={index === imagePreviews.length - 1}
                                aria-label="Mover imagen a la derecha"
                                title="Mover a la derecha"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    disabled={
                      !newProduct.name.trim() ||
                      !newProduct.brand.trim() ||
                      !newProduct.ean.trim() ||
                      !newProduct.categoryId ||
                      !formPrice ||
                      !formStock ||
                      !newProduct.description.trim() ||
                      imageFiles.length === 0
                    }
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
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, name: e.target.value })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Marca</label>
                <input
                  type="text"
                  placeholder="Ej: Bosch, Samsung..."
                  value={editProduct.brand}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, brand: e.target.value })
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
                <label>Precio de Oferta (ARS)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editProduct.offerPrice}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      offerPrice: e.target.value,
                    })
                  }
                />
              </div>

              <div className="dash-products__modal-field">
                <label>Categoría</label>
                <select
                  value={editProduct.categoryId}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      categoryId: e.target.value,
                    })
                  }
                  className="dash-products__modal-select"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                      value={editProduct.ean}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, ean: e.target.value })
                      }
                    />
                  </div>
                  <button
                    className="dash-products__ean-check-btn"
                    onClick={handleEditCheckEan}
                    disabled={!editProduct.ean.trim() || eanLoading}
                  >
                    {eanLoading ? "Buscando..." : "Verificar"}
                  </button>
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
                <label>Imágenes del producto</label>
                {editImageItems.length > 0 && (
                  <p className="dash-products__images-order-hint">
                    Ordená las imágenes arrastrando o con las flechas. La
                    primera será la principal.
                  </p>
                )}
                {editImageItems.length > 0 && (
                  <div className="dash-products__image-preview-grid">
                    {editImageItems.map((item, index) => (
                      <div
                        key={
                          item.type === "existing"
                            ? `${item.url}-${index}`
                            : `${item.preview}-${index}`
                        }
                        className={`dash-products__image-preview ${item.type === "new" ? "dash-products__image-preview--selected" : ""} ${draggingEditImageIndex === index ? "dash-products__image-preview--dragging" : ""}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingEditImageIndex(index);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleEditImageDrop(index)}
                        onDragEnd={() => setDraggingEditImageIndex(null)}
                      >
                        <img
                          src={
                            item.type === "existing" ? item.url : item.preview
                          }
                          alt={`Imagen ${index + 1}`}
                        />
                        <button
                          className="dash-products__image-remove"
                          onClick={() => removeEditImageItem(index)}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                        <div className="dash-products__image-order-controls">
                          <button
                            className="dash-products__image-order-btn"
                            onClick={() => moveEditImageItem(index, index - 1)}
                            type="button"
                            disabled={index === 0}
                            aria-label="Mover imagen a la izquierda"
                            title="Mover a la izquierda"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            className="dash-products__image-order-btn"
                            onClick={() => moveEditImageItem(index, index + 1)}
                            type="button"
                            disabled={index === editImageItems.length - 1}
                            aria-label="Mover imagen a la derecha"
                            title="Mover a la derecha"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className="dash-products__image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageChange}
                    hidden
                    disabled={editImageItems.length >= MAX_PRODUCT_IMAGES}
                  />
                  <Upload size={20} />
                  <span>
                    {editImageItems.length >= MAX_PRODUCT_IMAGES
                      ? "Límite alcanzado"
                      : "Agregar imágenes"}
                  </span>
                  <span className="dash-products__image-upload-hint">
                    JPG, PNG o WebP (máx. 5MB c/u). Hasta 4 imágenes.
                  </span>
                </label>
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
                disabled={!editProduct.name.trim() || !editProduct.price}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Floating Success Screen ===== */}
      {showSuccessModal && (
        <div className="dash-products__floating-overlay">
          <div className="dash-products__floating-screen">
            <div className="dash-products__floating-icon dash-products__floating-icon--success">
              <Check size={28} />
            </div>
            <div className="dash-products__floating-content">
              <span className="dash-products__floating-title">
                ¡Producto Agregado!
              </span>
              <p className="dash-products__floating-desc">
                Se guardó correctamente. ¿Deseas agregar otro?
              </p>
            </div>
            <div className="dash-products__floating-actions">
              <button
                className="dash-products__floating-btn dash-products__floating-btn--secondary"
                onClick={() => {
                  setShowSuccessModal(false);
                  resetAddModal();
                }}
              >
                Terminar
              </button>
              <button
                className="dash-products__floating-btn dash-products__floating-btn--primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  clearForm();
                  setAddOpen(true);
                }}
              >
                Agregar otro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Floating Delete Screen ===== */}
      {deleteConfirmOpen && (
        <div className="dash-products__floating-overlay">
          <div
            className="dash-products__floating-screen"
            style={{ borderColor: "rgba(250, 82, 82, 0.3)" }}
          >
            <div className="dash-products__floating-icon dash-products__floating-icon--danger">
              <Trash2 size={28} />
            </div>
            <div className="dash-products__floating-content">
              <span className="dash-products__floating-title">
                ¿Eliminar producto?
              </span>
              <p className="dash-products__floating-desc">
                Quitarás <strong>{productToDelete?.name}</strong> de tu
                catálogo.
              </p>
            </div>
            <div className="dash-products__floating-actions">
              <button
                className="dash-products__floating-btn dash-products__floating-btn--secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="dash-products__floating-btn dash-products__floating-btn--primary"
                style={{ background: "#fa5252" }}
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
