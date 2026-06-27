"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  DollarSign,
  Briefcase,
  Edit3,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getServicesByProfessionalAction } from "../../../app/actions/services";
import { getServiceCategoriesAction } from "../../../app/actions/categories";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "../../../app/actions/services";
import { getAccessToken } from "../../../utils/auth";
import "./DashboardServices.css";

export default function DashboardServices() {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState({
    id: null as number | null,
    name: "",
    description: "",
    categoryId: "",
    price: "",
  });

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  // Infinite Query for Services
  const {
    data,
    isLoading: loadingServices,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["professional-services", professionalId, submittedSearchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getServicesByProfessionalAction({
        professionalId: professionalId as number,
        name: submittedSearchQuery || undefined,
        page: pageParam,
        limit: 10,
      });
      return (result?.data as any) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage?.data)
        ? lastPage.data
        : Array.isArray(lastPage)
          ? lastPage
          : [];
      if (items.length < 10) return undefined;
      return allPages.length + 1;
    },
    enabled: !!professionalId,
    initialPageParam: 1,
  });

  const services = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page: any) =>
      Array.isArray(page?.data) ? page.data : Array.isArray(page) ? page : []
    );
  }, [data]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategoriesAction();
      return result?.data ?? [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const result = await createServiceAction({
        ...data,
        ...(token ? { token } : {}),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
      setSuccessMessage("¡Servicio creado correctamente!");
      setShowSuccessModal(true);
      closeModal();
    },
    onError: (error: any) => {
      if (error.status === 404) {
        setErrorMessage("El endpoint de creación no fue encontrado");
      } else {
        setErrorMessage("Hubo un error al crear el servicio.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const result = await updateServiceAction({
        id,
        data,
        token: getAccessToken(),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
      setSuccessMessage("¡Servicio actualizado correctamente!");
      setShowSuccessModal(true);
      closeModal();
    },
    onError: (error: any) => {
      if (error.status === 404) {
        setErrorMessage("El servicio no existe o el endpoint falló");
      } else {
        setErrorMessage("Hubo un error al actualizar el servicio.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteServiceAction({
        id,
        token: getAccessToken(),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    },
    onError: (error: any) => {
      if (error.status === 404) {
        setErrorMessage("El servicio ya no existe");
      } else {
        setErrorMessage("Hubo un error al eliminar el servicio.");
      }
    },
  });

  const handleSearch = () => {
    setSubmittedSearchQuery(searchQuery);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentService({
      id: null,
      name: "",
      description: "",
      categoryId: "",
      price: "",
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setIsEditing(true);
    setCurrentService({
      id: service.id,
      name: service.name,
      description: service.description || "",
      categoryId: String(service.category_services_id),
      price: String(service.base_price || ""),
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSave = () => {
    if (
      !currentService.name.trim() ||
      !currentService.categoryId ||
      !currentService.price
    ) {
      setErrorMessage("Por favor completá los campos obligatorios.");
      return;
    }

    const data = {
      professional_id: professionalId,
      category_services_id: Number(currentService.categoryId),
      name: currentService.name,
      description: currentService.description,
      base_price: Number(currentService.price),
    };

    if (isEditing && currentService.id) {
      updateMutation.mutate({ id: currentService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClick = (service: any) => {
    setServiceToDelete({ id: service.id, name: service.name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete.id);
    }
  };

  return (
    <div className="dash-services">
      {/* Header */}
      <div className="dash-services__header">
        <div>
          <span className="dash-services__label">GESTIÓN</span>
          <h1 className="dash-services__title">Servicios</h1>
        </div>
        <button className="dash-services__add-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="dash-services__toolbar">
        <div className="dash-services__search" style={{ display: "flex", gap: "8px", background: "transparent", border: "none", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "8px 12px", flex: 1 }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ border: "none", background: "transparent", outline: "none", paddingLeft: "8px", width: "100%", color: "var(--text-primary)" }}
            />
          </div>
          <button className="btn-primary" onClick={handleSearch} style={{ height: "100%", padding: "0 16px" }}>
            Buscar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dash-services__content">
        {loadingServices ? (
          <div className="dash-services__loading">
            <Loader2 className="animate-spin" size={32} />
            <p>Cargando servicios...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="dash-services__empty">
            <Briefcase size={48} />
            <h3>No tenés servicios publicados</h3>
            <p>
              Comenzá creando tu primer servicio para que los clientes te
              encuentren.
            </p>
            <button className="dash-services__empty-btn" onClick={openAddModal}>
              Crear mi primer servicio
            </button>
          </div>
        ) : (
          <div className="dash-services__grid">
            {services.map((service) => (
              <div key={service.id} className="dash-services__card">
                <div className="dash-services__card-header">
                  <div className="dash-services__card-info">
                    <h3>{service.name}</h3>
                    <span className="dash-services__card-category">
                      {categories.find(
                        (c) => c.id === service.category_services_id,
                      )?.name || "Sin categoría"}
                    </span>
                  </div>
                  <div className="dash-services__card-price">
                    {service.base_price ? (
                      <strong>
                        {Number(service.base_price).toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </strong>
                    ) : (
                      <span>Consultar</span>
                    )}
                  </div>
                </div>
                <p className="dash-services__card-desc">
                  {service.description || "Sin descripción"}
                </p>
                <div className="dash-services__card-footer">
                  <button
                    className="dash-services__card-action dash-services__card-action--edit"
                    onClick={() => openEditModal(service)}
                  >
                    <Edit3 size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    className="dash-services__card-action dash-services__card-action--delete"
                    onClick={() => handleDeleteClick(service)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Infinite Scroll Observer Target */}
        {hasNextPage && (
          <div ref={observerTarget} style={{ padding: "20px", textAlign: "center", display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
            {isFetchingNextPage && (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Cargando más servicios...</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="dash-services__overlay" onClick={closeModal}>
          <div
            className="dash-services__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-services__modal-header">
              <h2>{isEditing ? "Editar Servicio" : "Nuevo Servicio"}</h2>
              <button
                className="dash-services__modal-close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dash-services__form">
              {errorMessage && (
                <div className="dash-services__form-error">
                  <AlertTriangle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="dash-services__field">
                <label>Nombre del servicio *</label>
                <input
                  type="text"
                  placeholder="Ej: Pintura de interiores"
                  value={currentService.name}
                  onChange={(e) =>
                    setCurrentService({
                      ...currentService,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="dash-services__field">
                <label>Categoría *</label>
                <select
                  value={currentService.categoryId}
                  onChange={(e) =>
                    setCurrentService({
                      ...currentService,
                      categoryId: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-services__field">
                <label>Precio base (ARS) *</label>
                <div className="dash-services__price-input">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    placeholder="0"
                    value={currentService.price}
                    onChange={(e) =>
                      setCurrentService({
                        ...currentService,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="dash-services__field">
                <label>Descripción</label>
                <textarea
                  rows={4}
                  placeholder="Detallá de qué trata el servicio..."
                  value={currentService.description}
                  onChange={(e) =>
                    setCurrentService({
                      ...currentService,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="dash-services__modal-footer">
              <button
                className="dash-services__modal-cancel"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="dash-services__modal-save"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <span>
                    {isEditing ? "Guardar Cambios" : "Crear Servicio"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="dash-services__floating-overlay">
          <div className="dash-services__floating-screen">
            <div className="dash-services__floating-icon dash-services__floating-icon--success">
              <Check size={28} />
            </div>
            <div className="dash-services__floating-content">
              <span className="dash-services__floating-title">
                {successMessage}
              </span>
            </div>
            <div className="dash-services__floating-actions">
              <button
                className="dash-services__floating-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmOpen && (
        <div className="dash-services__floating-overlay">
          <div className="dash-services__floating-screen dash-services__floating-screen--danger">
            <div className="dash-services__floating-icon dash-services__floating-icon--danger">
              <Trash2 size={28} />
            </div>
            <div className="dash-services__floating-content">
              <span className="dash-services__floating-title">
                ¿Eliminar servicio?
              </span>
              <p className="dash-services__floating-desc">
                Estás por eliminar <strong>{serviceToDelete?.name}</strong>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="dash-services__floating-actions">
              <button
                className="dash-services__floating-btn dash-services__floating-btn--secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="dash-services__floating-btn dash-services__floating-btn--danger"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
