import React, { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  Loader2,
  Camera,
  X,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/utils/auth";
import {
  getPublicationsAction,
  createPublicationAction,
  updatePublicationAction,
  deletePublicationAction,
  Publication,
  getPublicationUploadUrlAction,
} from "@/app/actions/publications";
import "./DashboardPublications.css";
import { uploadPublicationsImage } from "@/services/storageUploads";

// Same image handling utils as in ProductCreator
function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const newArr = [...arr];
  const [removed] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, removed);
  return newArr;
}

export default function DashboardPublications() {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const subscriptionPlan = sessionStatus?.subscription?.plan ?? null;
  const canCreate = ["basico", "premium", "profesional-basico", "profesional-premium"].includes(
    subscriptionPlan?.toLowerCase() || ""
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [publicationToEdit, setPublicationToEdit] =
    useState<Publication | null>(null);

  // Publication form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggingNewImageIndex, setDraggingNewImageIndex] = useState<
    number | null
  >(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch publications
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["professional-publications", professionalId, debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
        if (!professionalId) return { items: [], total: 0 };
        const res = await getPublicationsAction({
          professionalId,
          title: debouncedSearch,
          page: pageParam,
          limit: 10,
        });
        if (res.serverError) throw new Error(res.serverError);
        return res.data;
      },
      initialPageParam: 1, // Start from page 1
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage && lastPage.items.length < 10) return undefined; // Assuming 10 items per page
        return allPages.length + 1;
      },
      enabled: !!professionalId,
    });

  const publications = data?.pages.flatMap((p) => p?.items || []) || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = getAccessToken();
      const res = await createPublicationAction({
        ...payload,
        token: token || "",
      });
      if (res.serverError) throw new Error(res.serverError);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-publications"],
      });
      setShowSuccessModal(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = getAccessToken();
      const res = await updatePublicationAction({
        ...payload,
        token: token || "",
      });
      if (res.serverError) throw new Error(res.serverError);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-publications"],
      });
      setShowSuccessModal(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAccessToken();
      const res = await deletePublicationAction({ id, token: token || "" });
      if (res.serverError) throw new Error(res.serverError);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-publications"],
      });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Form handling
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
    setPublicationToEdit(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreatorOpen(true);
  };

  const handleEdit = (pub: Publication) => {
    resetForm();
    setPublicationToEdit(pub);
    setFormTitle(pub.title || "");
    setFormDescription(pub.description || "");

    if (pub.publication_images && pub.publication_images.length > 0) {
      const sorted = [...pub.publication_images].sort(
        (a, b) => a.display_order - b.display_order,
      );
      const urls = sorted.map((i) => i.image_url);
      setImagePreviews(urls);
      setImageFiles(new Array(urls.length).fill(null));
    }

    setIsCreatorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta publicación?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseCreator = () => {
    setIsCreatorOpen(false);
    resetForm();
  };

  /* ── Image Upload Logic ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, url]);
      setImageFiles((prev) => [...prev, file]);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (idx: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNewImageDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    idx: number,
  ) => {
    setDraggingNewImageIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleNewImageDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();
  const handleNewImageDrop = (target: number) => {
    if (draggingNewImageIndex === null || draggingNewImageIndex === target)
      return;
    setImageFiles((p) => moveArrayItem(p, draggingNewImageIndex, target));
    setImagePreviews((p) => moveArrayItem(p, draggingNewImageIndex, target));
    setDraggingNewImageIndex(null);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!formTitle.trim()) e.title = "El título es obligatorio.";
    if (!formDescription.trim())
      e.description = "La descripción es obligatoria.";
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    try {
      const images_url: string[] = [];
      const images_to_save: string[] = [];
      const images: string[] = [];

      for (let i = 0; i < imagePreviews.length; i++) {
        const file = imageFiles[i];
        if (file) {
          const token = getAccessToken();
          const publicUrl = await getPublicationUploadUrlAction({
            token: token || "",
            fileType: file.type,
          });
          if (publicUrl.data?.uploadUrl && publicUrl.data?.key) {
            await uploadPublicationsImage(publicUrl.data.uploadUrl, file);
            images_to_save.push(publicUrl.data.key);
            images.push(publicUrl.data.key);
          }
        } else {
          images_url.push(imagePreviews[i]);
          images.push(imagePreviews[i]);
        }
      }

      if (publicationToEdit) {
        const originalUrls =
          publicationToEdit.publication_images?.map((i) => i.image_url) || [];
        const images_to_delete = originalUrls.filter(
          (url) => !images.includes(url),
        );

        updateMutation.mutate({
          id: publicationToEdit.id,
          title: formTitle,
          description: formDescription,
          images_url,
          images_to_save,
          images_to_delete,
        });
      } else {
        createMutation.mutate({
          title: formTitle,
          description: formDescription,
          images_to_save,
        });
      }
    } catch (err: any) {
      alert("Error guardando publicación: " + err.message);
    }
  };

  // Scroll handler for pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  if (isCreatorOpen) {
    return (
      <div className="dash-pubs__creator">
        <div className="dash-pubs__creator-header">
          <h2>
            {publicationToEdit ? "Editar Publicación" : "Crear Publicación"}
          </h2>
          <button
            className="dash-pubs__btn-cancel"
            onClick={handleCloseCreator}
            disabled={isSaving}
          >
            Cancelar
          </button>
        </div>

        <div className="dash-pubs__form">
          <div className="dash-pubs__field">
            <label>Título *</label>
            <input
              type="text"
              placeholder="Ej: Nuevo servicio disponible..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            {errors.title && (
              <span className="dash-pubs__error">{errors.title}</span>
            )}
          </div>

          <div className="dash-pubs__field">
            <label>Descripción *</label>
            <textarea
              rows={4}
              placeholder="Escribe el contenido de la publicación..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            {errors.description && (
              <span className="dash-pubs__error">{errors.description}</span>
            )}
          </div>

          <div className="dash-pubs__field">
            <label>Imágenes (Opcional)</label>
            <div className="dash-pubs__images-grid">
              {imagePreviews.map((preview, i) => (
                <div
                  key={`preview-${i}`}
                  className="dash-pubs__image-preview"
                  draggable
                  onDragStart={(e) => handleNewImageDragStart(e, i)}
                  onDragOver={handleNewImageDragOver}
                  onDrop={() => handleNewImageDrop(i)}
                >
                  <img src={preview} alt="Vista previa" />
                  <button type="button" onClick={() => removeNewImage(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div
                className="dash-pubs__image-add"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={24} />
                <span>Agregar foto</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg, image/png, image/webp"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <button
            className="dash-pubs__btn-save"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {isSaving ? "Guardando..." : "Guardar Publicación"}
          </button>
        </div>

        {/* Modal de Éxito */}
        {showSuccessModal && (
          <div className="dash-pubs__overlay">
            <div className="dash-pubs__modal dash-pubs__modal--success">
              <div className="modal-success-icon">
                <Check size={32} />
              </div>
              <h3>¡Publicación guardada!</h3>
              <p>Tu publicación ya es visible para los usuarios.</p>
              <button
                className="dash-pubs__modal-apply"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleCloseCreator();
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

  return (
    <div className="dash-pubs" onScroll={handleScroll}>
      <div className="dash-pubs__header">
        <h1 className="dash-pubs__title">Mis Publicaciones</h1>
        <button 
          className="dash-pubs__btn-add" 
          onClick={() => {
            if (!canCreate) {
              alert("Debes tener un plan Básico o Premium para crear publicaciones.");
              return;
            }
            handleOpenCreate();
          }}
        >
          {canCreate ? <Plus size={16} /> : <Lock size={16} />} Crear Publicación
        </button>
      </div>

      {!canCreate && !isCreatorOpen && publications.length === 0 && (
        <div className="dash-pubs__upgrade-notice" style={{
          background: "var(--surface-soft)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          textAlign: "center",
          margin: "var(--space-4) 0"
        }}>
          <Lock size={32} style={{ color: "var(--text-secondary)", margin: "0 auto var(--space-2)" }} />
          <p style={{ color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
            La creación de publicaciones es una funcionalidad exclusiva para planes Básico y Premium.
          </p>
        </div>
      )}

      <div className="dash-pubs__toolbar">
        <div className="dash-pubs__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-pubs__list">
        {isLoading ? (
          <div className="dash-pubs__loading">
            <Loader2 className="animate-spin" size={24} />
            <p>Cargando publicaciones...</p>
          </div>
        ) : publications.length === 0 ? (
          <div className="dash-pubs__empty">
            <p>No tienes publicaciones. ¡Creá la primera!</p>
          </div>
        ) : (
          publications.map((pub: Publication) => {
            const img =
              pub.publication_images && pub.publication_images.length > 0
                ? [...pub.publication_images].sort(
                    (a, b) => a.display_order - b.display_order,
                  )[0].image_url
                : null;
            return (
              <div key={pub.id} className="dash-pubs__item">
                {img && (
                  <img
                    src={img}
                    alt={pub.title}
                    className="dash-pubs__item-img"
                  />
                )}
                <div className="dash-pubs__item-content">
                  <h3>{pub.title}</h3>
                  <p>{pub.description}</p>
                </div>
                <div className="dash-pubs__item-actions">
                  <button onClick={() => handleEdit(pub)} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(pub.id)} title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {isFetchingNextPage && (
          <div className="dash-pubs__loading-more">
            <Loader2 className="animate-spin" size={16} /> Cargando más...
          </div>
        )}
      </div>
    </div>
  );
}
