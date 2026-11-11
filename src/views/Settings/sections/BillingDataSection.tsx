"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  ShieldCheck,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  commerceService,
  UserBillingData,
  TaxCondition,
  CreateUserBillingDataDto,
  UpdateUserBillingDataDto,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import "./BillingDataSection.css";

interface BillingDataSectionProps {
  userId?: string;
}

export default function BillingDataSection({ userId }: BillingDataSectionProps) {
  const queryClient = useQueryClient();
  const { user, sessionStatus } = useAuth();
  const { showSuccess, showError } = useAlert();

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserBillingData | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [cuit, setCuit] = useState("");
  const [taxCondition, setTaxCondition] = useState<TaxCondition>("consumidor_final");
  const [companyName, setCompanyName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Fetch user billing profiles
  const {
    data: billingList = [],
    isLoading,
    refetch,
  } = useQuery<UserBillingData[]>({
    queryKey: ["user-billing-data", userId],
    queryFn: () => commerceService.getMyBillingData(),
    enabled: !!user,
  });

  const canAddMore = billingList.length < 2;

  // Open modal for creation with autofilled full_name
  const handleOpenCreate = () => {
    setEditingItem(null);
    const suggestedName =
      sessionStatus?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "";
    setFullName(suggestedName);
    setCuit("");
    setTaxCondition("consumidor_final");
    setCompanyName("");
    setIsDefault(billingList.length === 0);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: UserBillingData) => {
    setEditingItem(item);
    setFullName(item.full_name);
    setCuit(item.cuit);
    setTaxCondition(item.tax_condition);
    setCompanyName(item.company_name || "");
    setIsDefault(item.is_default);
    setIsModalOpen(true);
  };

  // Save mutation (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanCuit = cuit.replace(/\D/g, "");
      if (!fullName.trim()) {
        throw new Error("El nombre y apellido es obligatorio.");
      }
      if (!cleanCuit || cleanCuit.length < 7 || cleanCuit.length > 11) {
        throw new Error("Ingresa un CUIT/CUIL válido (entre 7 y 11 dígitos).");
      }
      if (taxCondition === "responsable_inscripto" && !companyName.trim()) {
        throw new Error("La razón social / nombre de empresa es requerida para Responsable Inscripto.");
      }

      if (editingItem) {
        const payload: UpdateUserBillingDataDto = {
          full_name: fullName.trim(),
          cuit: cleanCuit,
          tax_condition: taxCondition,
          company_name: companyName.trim() || null,
          is_default: isDefault,
        };
        return commerceService.updateBillingData(editingItem.id, payload);
      } else {
        const payload: CreateUserBillingDataDto = {
          full_name: fullName.trim(),
          cuit: cleanCuit,
          tax_condition: taxCondition,
          company_name: companyName.trim() || null,
          is_default: isDefault,
        };
        return commerceService.createBillingData(payload);
      }
    },
    onSuccess: () => {
      showSuccess(
        editingItem
          ? "Datos de facturación actualizados."
          : "Datos de facturación guardados.",
      );
      queryClient.invalidateQueries({ queryKey: ["user-billing-data"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showError(err?.message || "No se pudo guardar la información fiscal.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => commerceService.deleteBillingData(id),
    onSuccess: () => {
      showSuccess("Registro de facturación eliminado.");
      queryClient.invalidateQueries({ queryKey: ["user-billing-data"] });
    },
    onError: () => showError("No se pudo eliminar el registro."),
  });

  return (
    <div className="billing-section">
      <div className="billing-section__header">
        <div className="billing-section__header-info">
          <div className="billing-section__icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="billing-section__title">Datos de Facturación</h3>
            <p className="billing-section__subtitle">
              Estos datos se envían al comercio al comprar un producto o servicio para la confección de tu factura (máx. 2 registros).
            </p>
          </div>
        </div>

        {canAddMore ? (
          <button data-action-tone="add"
            type="button"
            className="btn-primary billing-section__add-btn"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Agregar Datos</span>
          </button>
        ) : (
          <span className="billing-section__limit-badge" title="Límite alcanzado">
            Límite alcanzado (2/2)
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="billing-section__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Cargando datos fiscales...</span>
        </div>
      ) : billingList.length === 0 ? (
        <div className="billing-section__empty">
          <FileText size={40} className="billing-section__empty-icon" />
          <h4 className="billing-section__empty-title">
            Sin datos de facturación guardados
          </h4>
          <p className="billing-section__empty-desc">
            Agregá tu CUIT y condición fiscal para que los vendedores emitan tu Factura A o B de forma automática en cada compra.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Registrar datos de facturación</span>
          </button>
        </div>
      ) : (
        <div className="billing-section__cards-grid">
          {billingList.map((item) => {
            const isRespInscripto = item.tax_condition === "responsable_inscripto";
            return (
              <div
                key={item.id}
                className={`billing-section__card ${
                  item.is_default ? "billing-section__card--default" : ""
                }`}
              >
                <div className="billing-section__card-top">
                  <div className="billing-section__tax-tag-wrap">
                    <span
                      className={`billing-section__tax-badge ${
                        isRespInscripto
                          ? "billing-section__tax-badge--company"
                          : "billing-section__tax-badge--final"
                      }`}
                    >
                      {isRespInscripto ? (
                        <>
                          <Building size={12} />
                          <span>Responsable Inscripto</span>
                        </>
                      ) : (
                        <>
                          <User size={12} />
                          <span>Consumidor Final</span>
                        </>
                      )}
                    </span>
                    {item.is_default && (
                      <span className="billing-section__default-tag">
                        Predeterminado
                      </span>
                    )}
                  </div>

                  <div className="billing-section__card-actions">
                    <button
                      type="button"
                      className="billing-section__action-btn"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar datos"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="billing-section__action-btn billing-section__action-btn--delete"
                      onClick={() => {
                        if (
                          window.confirm(
                            "¿Seguro que deseás eliminar este registro de facturación?",
                          )
                        ) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      title="Eliminar datos"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="billing-section__card-body">
                  <h4 className="billing-section__card-name">{item.full_name}</h4>
                  <div className="billing-section__card-row">
                    <span className="billing-section__card-label">CUIT / CUIL:</span>
                    <strong className="billing-section__card-cuit">{item.cuit}</strong>
                  </div>
                  {item.company_name && (
                    <div className="billing-section__card-row">
                      <span className="billing-section__card-label">Razón Social:</span>
                      <span className="billing-section__card-company">
                        {item.company_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create / edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? "Modificar Datos de Facturación"
            : "Nuevo Registro de Facturación"
        }
      >
        <form
          className="billing-section__form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="billing-section__form-field">
            <label className="billing-section__form-label">
              Nombre y Apellido *
            </label>
            <input
              type="text"
              required
              className="billing-section__input"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <span className="billing-section__field-hint">
              Nombre que figurará en el comprobante fiscal.
            </span>
          </div>

          <div className="billing-section__form-field">
            <label className="billing-section__form-label">
              CUIT / CUIL *
            </label>
            <input
              type="text"
              required
              className="billing-section__input"
              placeholder="Ej. 20-12345678-9"
              value={cuit}
              onChange={(e) => setCuit(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
            <span className="billing-section__field-hint">
              Ingresá los 11 dígitos sin guiones ni espacios.
            </span>
          </div>

          <div className="billing-section__form-field">
            <label className="billing-section__form-label">
              Condición frente al IVA *
            </label>
            <div className="billing-section__condition-tabs">
              <button
                type="button"
                className={`billing-section__condition-tab ${
                  taxCondition === "consumidor_final"
                    ? "billing-section__condition-tab--active"
                    : ""
                }`}
                onClick={() => setTaxCondition("consumidor_final")}
              >
                <User size={16} />
                <span>Consumidor Final (Factura B)</span>
              </button>

              <button
                type="button"
                className={`billing-section__condition-tab ${
                  taxCondition === "responsable_inscripto"
                    ? "billing-section__condition-tab--active"
                    : ""
                }`}
                onClick={() => setTaxCondition("responsable_inscripto")}
              >
                <Building size={16} />
                <span>Responsable Inscripto (Factura A)</span>
              </button>
            </div>
          </div>

          {taxCondition === "responsable_inscripto" && (
            <div className="billing-section__form-field">
              <label className="billing-section__form-label">
                Nombre de la Empresa / Razón Social *
              </label>
              <input
                type="text"
                required
                className="billing-section__input"
                placeholder="Ej. Servicios SRL"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          )}

          <div className="billing-section__checkbox-field">
            <label className="billing-section__checkbox-label">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <span>Usar como datos predeterminados en mis compras</span>
            </label>
          </div>

          <div className="billing-section__form-actions">
            <button data-action-tone="cancel"
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Datos</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
