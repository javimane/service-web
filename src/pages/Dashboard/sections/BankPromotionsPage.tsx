import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Landmark,
  CreditCard,
  CalendarDays,
  Percent,
  Trash2,
  Edit2,
  X,
  Save,
  Building2,
  Loader2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  bankPromotionService,
  bankService,
  BankPromotion,
} from "../../../services/bankPromotionService";
import "./BankPromotionsPage.css";

const DAYS_OF_WEEK = [
  { id: "monday", label: "L" },
  { id: "tuesday", label: "M" },
  { id: "wednesday", label: "X" },
  { id: "thursday", label: "J" },
  { id: "friday", label: "V" },
  { id: "saturday", label: "S" },
  { id: "sunday", label: "D" },
];

export default function BankPromotionsPage() {
  const queryClient = useQueryClient();

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: bankPromotionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-promotions"] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Error al crear la promoción");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bankPromotionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-promotions"] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.message || "Error al actualizar la promoción");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bankPromotionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-promotions"] });
      setIsDeleteModalOpen(false);
      setPromoToDelete(null);
    },
    onError: (err: any) => {
      alert(err.message || "Error al eliminar la promoción");
      setIsDeleteModalOpen(false);
    },
  });

  const submitting = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<BankPromotion | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const {
    data: promos = [],
    isLoading: promosLoading,
    error: fetchPromosError,
  } = useQuery({
    queryKey: ["bank-promotions"],
    queryFn: async () => {
      const data = await bankPromotionService.getMyPromotions();
      console.log("DEBUG: Promociones cargadas:", data);
      return data;
    },
  });

  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const data = await bankService.findAll();
      console.log("DEBUG: Bancos cargados:", data);
      return data;
    },
  });

  const loading = promosLoading || banksLoading;
  const error = fetchPromosError ? "No se pudieron cargar las promociones." : formError;

  const [form, setForm] = useState({
    percentaje_discount: 0,
    refund: 0,
    bank_id: 0,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    from_date: new Date().toISOString().split("T")[0],
    expiration_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split("T")[0],
    description: "",
  });

  const fetchData = async () => {
    queryClient.invalidateQueries({ queryKey: ["bank-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["banks"] });
  };

  const handleOpenModal = (promo: BankPromotion | null = null) => {
    if (promo) {
      setEditingPromo(promo);
      setForm({
        percentaje_discount: promo.percentaje_discount,
        refund: promo.refund,
        bank_id: promo.bank_id,
        monday: promo.monday,
        tuesday: promo.tuesday,
        wednesday: promo.wednesday,
        thursday: promo.thursday,
        friday: promo.friday,
        saturday: promo.saturday,
        sunday: promo.sunday,
        from_date: promo.from_date,
        expiration_date: promo.expiration_date,
        description: promo.description || "",
      });
    } else {
      setEditingPromo(null);
      setForm({
        percentaje_discount: 0,
        refund: 0,
        bank_id: banks.length > 0 ? banks[0].id : 0,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        from_date: new Date().toISOString().split("T")[0],
        expiration_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split("T")[0],
        description: "",
      });
    }
    if (error !== "No se pudieron cargar las promociones.") {
      setFormError("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleDayToggle = (dayId: string) => {
    setForm((prev: any) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const handleSave = async () => {
    if (!form.bank_id) {
      setFormError("Debe seleccionar un banco.");
      return;
    }
    if (form.percentaje_discount <= 0) {
      setFormError("El porcentaje de descuento debe ser mayor a 0.");
      return;
    }
    if (form.refund < 0) {
      setFormError("El tope de reintegro no puede ser negativo.");
      return;
    }
    const hasDays = [
      form.monday,
      form.tuesday,
      form.wednesday,
      form.thursday,
      form.friday,
      form.saturday,
      form.sunday,
    ].some((d) => d);
    if (!hasDays) {
      setFormError("Debe seleccionar al menos un día de aplicación.");
      return;
    }

    setFormError("");

    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string) => {
    setPromoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (promoToDelete) {
      deleteMutation.mutate(promoToDelete);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPromoToDelete(null);
  };

  const getActiveDays = (promo: BankPromotion) => {
    return DAYS_OF_WEEK.filter((day) => (promo as any)[day.id]);
  };

  if (loading) {
    return (
      <div className="bank-promos__loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Cargando promociones...</p>
      </div>
    );
  }

  return (
    <div className="bank-promos">
      <div className="bank-promos__header">
        <div>
          <span className="bank-promos__label">FINANZAS</span>
          <h1 className="bank-promos__title">Promociones Bancarias</h1>
        </div>
        <button
          type="button"
          className="bank-promos__create-btn"
          onClick={() => handleOpenModal()}
        >
          <Plus size={18} />
          Nueva Promoción
        </button>
      </div>
      
      {error && (
        <div className="bank-promo-error-message" style={{ margin: "0 0 20px 0" }}>
          {error}
        </div>
      )}

      <div className="bank-promos__grid">
        {promos.map((promo) => (
          <div key={promo.id} className="bank-promo-card">
            <div className="bank-promo-card__header">
              <div className="bank-promo-card__bank">
                <div className="bank-promo-card__icon">
                  <Building2 size={24} />
                </div>
                <div className="bank-promo-card__bank-info">
                  <h3>{promo.bank?.name || "Banco"}</h3>
                  <p>{promo.description || "Sin descripción"}</p>
                </div>
              </div>
              <div className="bank-promo-card__actions">
                <button
                  type="button"
                  className="bank-promo-card__action"
                  onClick={() => handleOpenModal(promo)}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  className="bank-promo-card__action bank-promo-card__action--danger"
                  onClick={() => handleDelete(promo.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="bank-promo-card__details">
              <div className="bank-promo-card__detail-row">
                <span className="bank-promo-card__detail-label">
                  <Percent size={14} /> Descuento
                </span>
                <span className="bank-promo-card__detail-value bank-promo-card__detail-value--highlight">
                  {promo.percentaje_discount}% OFF
                </span>
              </div>
              <div className="bank-promo-card__detail-row">
                <span className="bank-promo-card__detail-label">
                  <CreditCard size={14} /> Tope de reintegro
                </span>
                <span className="bank-promo-card__detail-value">
                  ${promo.refund.toLocaleString()}
                </span>
              </div>
              <div className="bank-promo-card__detail-row">
                <span className="bank-promo-card__detail-label">
                  <CalendarDays size={14} /> Vigencia
                </span>
                <span className="bank-promo-card__detail-value">
                  {new Date(promo.from_date).toLocaleDateString()} -{" "}
                  {new Date(promo.expiration_date).toLocaleDateString()}
                </span>
              </div>
              <div
                className="bank-promo-card__detail-row"
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span className="bank-promo-card__detail-label">
                  Días de aplicación
                </span>
                <div className="bank-promo-card__days">
                  {DAYS_OF_WEEK.map((day) => (
                    <span
                      key={day.id}
                      className={`bank-promo-card__day ${
                        (promo as any)[day.id] ? "active" : ""
                      }`}
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="bank-promos__empty">
            <div className="empty-icon-container">
              <Landmark size={48} />
            </div>
            <h3>Sin promociones activas</h3>
            <p>
              Configura las promociones de bancos y billeteras virtuales para
              tus clientes.
            </p>
            <button
              className="bank-promo-btn bank-promo-btn--primary"
              onClick={() => handleOpenModal()}
            >
              <Plus size={18} /> Crear Primera Promoción
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="bank-promo-modal-overlay">
          <div className="bank-promo-modal">
            <div className="bank-promo-modal__header">
              <h2>
                {editingPromo ? "Editar Promoción" : "Nueva Promoción Bancaria"}
              </h2>
              <button
                type="button"
                className="bank-promo-modal__close"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="bank-promo-modal__body">
              {error && <div className="bank-promo-error-message">{error}</div>}
              <div className="bank-promo-form-grid">
                <div className="bank-promo-field bank-promo-field--full">
                  <label>Banco o Entidad</label>
                  <div className="bank-promo-input-wrapper">
                    <Landmark size={18} className="field-icon" />
                    <select
                      value={form.bank_id}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bank_id: Number(e.target.value),
                        }))
                      }
                    >
                      <option value={0} disabled>
                        Selecciona un banco...
                      </option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Descuento (%)</label>
                  <div className="bank-promo-input-wrapper">
                    <Percent size={18} className="field-icon" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ej. 20"
                      value={form.percentaje_discount || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          percentaje_discount: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Tope de Reintegro ($)</label>
                  <div className="bank-promo-input-wrapper">
                    <Save size={18} className="field-icon" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej. 5000"
                      value={form.refund || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          refund: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Fecha Desde</label>
                  <div className="bank-promo-input-wrapper">
                    <CalendarDays size={18} className="field-icon" />
                    <input
                      type="date"
                      value={form.from_date}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          from_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Fecha Hasta</label>
                  <div className="bank-promo-input-wrapper">
                    <CalendarDays size={18} className="field-icon" />
                    <input
                      type="date"
                      value={form.expiration_date}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          expiration_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field bank-promo-field--full">
                  <label>Descripción (Opcional)</label>
                  <div className="bank-promo-input-wrapper">
                    <FileText size={18} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Ej. Promo especial verano"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field bank-promo-field--full">
                  <label>Días de Aplicación</label>
                  <div className="bank-promo-days-selector">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`bank-promo-day-btn ${
                          (form as any)[day.id] ? "selected" : ""
                        }`}
                        onClick={() => handleDayToggle(day.id)}
                      >
                        <span className="bank-promo-day-label">
                          {day.label}
                        </span>
                        {(form as any)[day.id] && (
                          <X size={12} className="day-remove-icon" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bank-promo-modal__footer">
              <button
                type="button"
                className="bank-promo-btn bank-promo-btn--danger"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <X size={16} /> Cancelar
              </button>
              <button
                type="button"
                className="bank-promo-btn bank-promo-btn--primary"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                {editingPromo ? "Guardar Cambios" : "Crear Promoción"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="bank-promo-modal-overlay">
          <div className="bank-promo-modal bank-promo-modal--confirm">
            <div className="bank-promo-modal__confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <div className="bank-promo-modal__confirm-content">
              <h2>¿Eliminar promoción?</h2>
              <p>
                Esta acción no se puede deshacer. La promoción dejará de estar
                disponible para los clientes.
              </p>
            </div>
            <div className="bank-promo-modal__footer">
              <button
                type="button"
                className="bank-promo-btn"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bank-promo-btn bank-promo-btn--danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                Eliminar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
