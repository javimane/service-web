"use client";
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
  WalletCards,
} from "lucide-react";
import {
  bankPromotionService,
  bankService,
  BankPromotion,
} from "../../../services/bankPromotionService";
import { formatDateDisplay } from "../../../utils/utils";
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

const PAYMENT_METHODS = [
  "QR o NFC PRESENCIAL",
  "ONLINE",
  "TARJETAS CRÉDITO",
  "TARJETAS DÉBITO",
];

export default function BankPromotionsPage() {
  const queryClient = useQueryClient();

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: (data: any) => bankPromotionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-promotions"] });
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
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);

  const {
    data: promos = [],
    isLoading: promosLoading,
    error: fetchPromosError,
  } = useQuery({
    queryKey: ["bank-promotions"],
    queryFn: async () => {
      const data = await bankPromotionService.getMyPromotions();
      return data;
    },
  });

  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const data = await bankService.findAll();
      return data;
    },
  });

  const loading = promosLoading || banksLoading;
  const error = fetchPromosError
    ? "No se pudieron cargar las promociones."
    : formError;

  const getPromoBankIds = (promo: BankPromotion): number[] => {
    const relationIds = (promo.bank_promotions_banks || [])
      .map((relation) => relation.Bank?.id ?? relation.bank_id)
      .filter((id): id is number => typeof id === "number");

    if (relationIds.length > 0) {
      return Array.from(new Set(relationIds));
    }

    if (typeof promo.bank_id === "number") {
      return [promo.bank_id];
    }

    return [];
  };

  const getPromoBankNames = (promo: BankPromotion): string[] => {
    const relationNames = (promo.bank_promotions_banks || [])
      .map((relation) => relation.Bank?.name)
      .filter((name): name is string => Boolean(name));

    if (relationNames.length > 0) {
      return Array.from(new Set(relationNames));
    }

    if (promo.Bank?.name) {
      return [promo.Bank.name];
    }

    if (typeof promo.bank_id === "number") {
      const fallbackBank = banks.find((bank) => bank.id === promo.bank_id);
      return [fallbackBank?.name || "Banco"];
    }

    return ["Banco"];
  };

  const [form, setForm] = useState({
    percentaje_discount: 0,
    refund: 0,
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
    payment_method: "[]",
    terms_conditions: "",
    minimum_amount: 0,
  });

  const handleOpenModal = (promo: BankPromotion | null = null) => {
    if (promo) {
      setEditingPromo(promo);
      setForm({
        percentaje_discount: promo.percentaje_discount,
        refund: promo.refund,
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
        payment_method: promo.payment_method || "[]",
        terms_conditions: promo.terms_conditions || "",
        minimum_amount: promo.minimum_amount || 0,
      });
      setSelectedBankIds(getPromoBankIds(promo));
    } else {
      setEditingPromo(null);
      setForm({
        percentaje_discount: 0,
        refund: 0,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        from_date: new Date().toISOString().split("T")[0],
        expiration_date: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        )
          .toISOString()
          .split("T")[0],
        description: "",
        payment_method: "[]",
        terms_conditions: "",
        minimum_amount: 0,
      });
      setSelectedBankIds([]);
    }
    if (error !== "No se pudieron cargar las promociones.") {
      setFormError("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError("");
    setSelectedBankIds([]);
  };

  const handleDayToggle = (dayId: string) => {
    setForm((prev: any) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const handleBankToggle = (bankId: number) => {
    setSelectedBankIds((prev) => {
      return prev.includes(bankId)
        ? prev.filter((id) => id !== bankId)
        : [bankId, ...prev];
    });
  };

  const handleSave = async () => {
    if (selectedBankIds.length === 0) {
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

    try {
      const uniqueBankIds = Array.from(new Set(selectedBankIds));
      const payload = { ...form, bankIds: uniqueBankIds };

      if (editingPromo) {
        await updateMutation.mutateAsync({
          id: editingPromo.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      handleCloseModal();
    } catch (err: any) {
      // Error is handled by mutation onError, but we catch it here to prevent closing modal if it fails
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
        <div
          className="bank-promo-error-message"
          style={{ margin: "0 0 20px 0" }}
        >
          {error}
        </div>
      )}

      <div className="bank-promos__grid">
        {promos.map((promo) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Split YYYY-MM-DD to avoid timezone shifting
          const [year, month, day] = promo.expiration_date
            .split("-")
            .map(Number);
          const expirationDate = new Date(year, month - 1, day);

          const isExpired = expirationDate < today;

          return (
            <div
              key={promo.id}
              className={`bank-promo-card ${isExpired ? "bank-promo-card--expired" : ""}`}
            >
              {(() => {
                const bankNames = getPromoBankNames(promo);
                const primaryName = bankNames[0] || "Banco";
                const secondaryCount = Math.max(bankNames.length - 1, 0);

                return (
                  <>
                    {isExpired && (
                      <div className="bank-promo-card__expired-badge">
                        Expirado
                      </div>
                    )}
                    <div className="bank-promo-card__header">
                      <div className="bank-promo-card__bank">
                        <div className="bank-promo-card__icon">
                          <Building2 size={24} />
                        </div>
                        <div className="bank-promo-card__bank-info">
                          <h3>
                            {primaryName}
                            {secondaryCount > 0 ? ` +${secondaryCount}` : ""}
                          </h3>
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

                    {bankNames.length > 1 && (
                      <div
                        className="bank-promo-card__detail-row"
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span className="bank-promo-card__detail-label">
                          Bancos
                        </span>
                        <div className="bank-promo-card__methods">
                          {bankNames.map((bankName) => (
                            <span
                              key={bankName}
                              className="bank-promo-method-tag"
                            >
                              {bankName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

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
                      {(promo.minimum_amount ?? 0) > 0 && (
                        <div className="bank-promo-card__detail-row">
                          <span className="bank-promo-card__detail-label">
                            <WalletCards size={14} /> Compra mínima
                          </span>
                          <span className="bank-promo-card__detail-value">
                            ${(promo.minimum_amount ?? 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="bank-promo-card__detail-row">
                        <span className="bank-promo-card__detail-label">
                          <CalendarDays size={14} /> Vigencia
                        </span>
                        <span className="bank-promo-card__detail-value">
                          {formatDateDisplay(promo.from_date)} -{" "}
                          {formatDateDisplay(promo.expiration_date)}
                        </span>
                      </div>

                      {promo.payment_method &&
                        JSON.parse(promo.payment_method).length > 0 && (
                          <div
                            className="bank-promo-card__detail-row"
                            style={{
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "8px",
                            }}
                          >
                            <span className="bank-promo-card__detail-label">
                              Métodos de pago
                            </span>
                            <div className="bank-promo-card__methods">
                              {JSON.parse(promo.payment_method).map(
                                (m: string) => (
                                  <span
                                    key={m}
                                    className="bank-promo-method-tag"
                                  >
                                    {m}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

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
                  </>
                );
              })()}
            </div>
          );
        })}
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
                  <label>Bancos o Entidades (Selecciona uno o más)</label>
                  <div className="bank-promo-checkbox-list">
                    {banks.map((bank) => {
                      const bankId = bank.id;
                      const isSelected = selectedBankIds.includes(bankId);
                      return (
                        <div
                          key={bank.id}
                          className={`bank-promo-checkbox-item ${isSelected ? "selected" : ""}`}
                          onClick={() => handleBankToggle(bankId)}
                        >
                          <div className="checkbox-wrapper">
                            <div className="checkbox-custom">
                              {isSelected && <div className="checkbox-inner" />}
                            </div>
                          </div>
                          <span className="bank-name">{bank.name}</span>
                        </div>
                      );
                    })}
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
                  <label>Compra Mínima ($)</label>
                  <div className="bank-promo-input-wrapper">
                    <WalletCards size={18} className="field-icon" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej. 1000"
                      value={form.minimum_amount || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          minimum_amount: Number(e.target.value),
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
                  <label>Métodos de Pago</label>
                  <div className="bank-promo-methods-selector">
                    {PAYMENT_METHODS.map((method) => {
                      const selectedMethods = JSON.parse(
                        form.payment_method || "[]",
                      );
                      const isSelected = selectedMethods.includes(method);
                      return (
                        <button
                          key={method}
                          type="button"
                          className={`bank-promo-method-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            const newMethods = isSelected
                              ? selectedMethods.filter(
                                  (m: string) => m !== method,
                                )
                              : [...selectedMethods, method];
                            setForm((prev) => ({
                              ...prev,
                              payment_method: JSON.stringify(newMethods),
                            }));
                          }}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bank-promo-field bank-promo-field--full">
                  <label>Términos y Condiciones</label>
                  <div className="bank-promo-input-wrapper bank-promo-input-wrapper--textarea">
                    <FileText size={18} className="field-icon" />
                    <textarea
                      placeholder="Escribe aquí los términos y condiciones de la promoción..."
                      value={form.terms_conditions}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          terms_conditions: e.target.value,
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
