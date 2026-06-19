"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageCircle, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";
import Modal from "../../../components/Modal/Modal";
import { getAccessToken } from "../../../utils/auth";
import { uploadJobRequestImage } from "../../../services/storageUploads";
import {
  listMyJobRequestsAction,
  searchJobRequestsAction,
  createJobRequestAction,
  deleteJobRequestAction,
} from "../../../app/actions/jobRequests";
import { getProvincesAction } from "../../../app/actions/provinces";
import { getServiceCategoriesAction } from "../../../app/actions/categories";
import "./JobRequestsSection.css";

interface JobRequestRow {
  id: string;
  user_id: string;
  description: string;
  image_url?: string | null;
  categories_services: number[];
  provinces_id: number[];
  created_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

export default function JobRequestsSection() {
  const { hasProfessionalSubscription, user } = useAuth();
  const { showError } = useAlert();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const [filterProvince, setFilterProvince] = useState<number | "">("");
  const [page, setPage] = useState<number>(1);

  // Create form state
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedProvince, setSelectedProvince] = useState<number | "">("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: provincesData } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await getProvincesAction();
      return res?.data || [];
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const res = await getServiceCategoriesAction();
      return res?.data || [];
    },
  });

  const { data: requestsData, isLoading } = useQuery({
    queryKey: [
      "job-requests",
      hasProfessionalSubscription,
      filterCategory,
      filterProvince,
      page,
    ],
    queryFn: async () => {
      const token = await getAccessToken();
      if (hasProfessionalSubscription) {
        const res = await searchJobRequestsAction({
          category: filterCategory !== "" ? Number(filterCategory) : undefined,
          province: filterProvince !== "" ? Number(filterProvince) : undefined,
          page,
          token,
        });
        const data = res?.data || {};
        if (data && typeof data === "object" && "items" in data) {
          return {
            items: (Array.isArray(data.items)
              ? data.items
              : []) as JobRequestRow[],
            totalPages: data.totalPages || 1,
            page: data.page || 1,
          };
        }
        return {
          items: (Array.isArray(data)
            ? data
            : data?.data || []) as JobRequestRow[],
          totalPages: 1,
          page: 1,
        };
      } else {
        const res = await listMyJobRequestsAction({ token });
        const data = res?.data as any;
        const items = (
          Array.isArray(data) ? data : data?.data || []
        ) as JobRequestRow[];
        return { items, totalPages: 1, page: 1 };
      }
    },
  });

  const provinces = Array.isArray(provincesData) ? provincesData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (selectedImage) {
        const uploadRes = await uploadJobRequestImage({
          file: selectedImage,
          fileName: `req_${Date.now()}_${selectedImage.name}`,
        });
        imageUrl = uploadRes.publicUrl;
      }

      const token = await getAccessToken();
      await createJobRequestAction({
        data: {
          description,
          image_url: imageUrl,
          categories_services:
            selectedCategory !== "" ? [Number(selectedCategory)] : [],
          provinces_id:
            selectedProvince !== "" ? [Number(selectedProvince)] : [],
        },
        token,
      });

      // Reset form
      setDescription("");
      setSelectedCategory("");
      setSelectedProvince("");
      setSelectedImage(null);
      setImagePreview(null);
      setIsCreateModalOpen(false);

      queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    } catch (error) {
      console.error("Error creating job request:", error);
      showError("Hubo un error al crear la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta solicitud?")) return;

    try {
      const token = await getAccessToken();
      await deleteJobRequestAction({ id, token });
      queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    } catch (error) {
      console.error("Error deleting request:", error);
      showError("Hubo un error al eliminar la solicitud.");
    }
  };

  const getCategoryName = (id: number) => {
    const cat = categories.find((c: any) => c.id === id);
    return cat ? cat.name : "Categoría";
  };

  const getProvinceName = (id: number) => {
    const prov = provinces.find((p: any) => p.id === id);
    return prov ? prov.name : "Provincia";
  };

  return (
    <div className="job-requests-section">
      <div className="job-requests-section__header">
        <h2 className="job-requests-section__title">
          {hasProfessionalSubscription
            ? "Solicitudes de Trabajo Disponibles"
            : "Mis Solicitudes de Trabajo"}
        </h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Crear Solicitud
        </button>
      </div>

      {hasProfessionalSubscription && (
        <div className="job-requests-section__filters-container">
          <div className="job-requests-section__filters-title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros de Búsqueda
          </div>
          <div className="job-requests-section__filters">
            <div className="job-requests-section__filter-group">
              <label>Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(
                    e.target.value === "" ? "" : Number(e.target.value),
                  );
                  setPage(1);
                }}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="job-requests-section__filter-group">
              <label>Provincia</label>
              <select
                value={filterProvince}
                onChange={(e) => {
                  setFilterProvince(
                    e.target.value === "" ? "" : Number(e.target.value),
                  );
                  setPage(1);
                }}
              >
                <option value="">Todas las provincias</option>
                {provinces.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Cargando solicitudes...</p>
      ) : requestsData?.items && requestsData.items.length > 0 ? (
        <div className="job-requests-grid">
          {requestsData.items.map((req) => (
            <div key={req.id} className="job-request-card">
              <div className="job-request-card__image-container">
                {req.image_url ? (
                  <img
                    src={req.image_url}
                    alt="Request"
                    className="job-request-card__image"
                  />
                ) : (
                  <div className="job-request-card__no-image">
                    <ImageIcon size={48} />
                  </div>
                )}
              </div>
              <div className="job-request-card__content">
                <div className="job-request-card__header">
                  <div className="job-request-card__avatar">
                    {req.avatar_url ? (
                      <img
                        src={req.avatar_url}
                        alt={req.display_name || "User"}
                      />
                    ) : (
                      (req.display_name || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="job-request-card__user-info">
                    <span className="job-request-card__user-name">
                      {req.display_name || "Usuario Anónimo"}
                    </span>
                    <span className="job-request-card__date">
                      {new Date(req.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>

                <p className="job-request-card__description">
                  {req.description}
                </p>

                <div className="job-request-card__tags">
                  {req.categories_services?.map((catId) => (
                    <span
                      key={`cat-${catId}`}
                      className="job-request-card__tag"
                    >
                      {getCategoryName(catId)}
                    </span>
                  ))}
                  {req.provinces_id?.map((provId) => (
                    <span
                      key={`prov-${provId}`}
                      className="job-request-card__tag"
                    >
                      {getProvinceName(provId)}
                    </span>
                  ))}
                </div>

                <div className="job-request-card__footer">
                  {req.user_id === user?.id ? (
                    <button
                      type="button"
                      className="job-request-card__btn-delete"
                      onClick={() => handleDelete(req.id)}
                    >
                      Eliminar
                    </button>
                  ) : hasProfessionalSubscription ? (
                    <button
                      type="button"
                      className="job-request-card__btn-contact"
                    >
                      <MessageCircle size={16} />
                      Contactar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="job-requests-section__empty">
          <p>No se encontraron solicitudes de trabajo.</p>
        </div>
      )}

      {requestsData?.totalPages && requestsData.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "2rem",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={requestsData.page <= 1}
          >
            Anterior
          </button>
          <span
            style={{
              fontWeight: "var(--weight-semibold)",
              color: "var(--text-secondary)",
            }}
          >
            Página {requestsData.page} de {requestsData.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setPage((p) => Math.min(requestsData.totalPages, p + 1))
            }
            disabled={requestsData.page >= requestsData.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Creación de Solicitud */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Solicitud de Trabajo"
      >
        <form className="job-request-form" onSubmit={handleCreateSubmit}>
          <div className="job-request-form__group">
            <label>¿Qué necesitas?</label>
            <textarea
              className="job-request-form__textarea"
              placeholder="Describe detalladamente el trabajo que necesitas realizar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="job-request-form__group">
            <label>Categoría del servicio</label>
            <select
              className="job-request-form__select"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            >
              <option value="">Selecciona una categoría (Opcional)</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="job-request-form__group">
            <label>Provincia</label>
            <select
              className="job-request-form__select"
              value={selectedProvince}
              onChange={(e) =>
                setSelectedProvince(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            >
              <option value="">Selecciona tu provincia (Opcional)</option>
              {provinces.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="job-request-form__group">
            <label>Imagen de referencia (Opcional)</label>
            <div className="job-request-form__image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="job-request-form__image-preview"
                />
              ) : (
                <div style={{ color: "var(--text-secondary)" }}>
                  <ImageIcon size={32} style={{ marginBottom: "8px" }} />
                  <p>Haz clic o arrastra una imagen aquí</p>
                </div>
              )}
            </div>
          </div>

          <div className="job-request-form__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? "Publicando..." : "Publicar Solicitud"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
