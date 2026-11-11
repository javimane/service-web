"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle2,
  Edit2,
  Plus,
  Building,
  User,
  Loader2,
  Check,
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
import "./OrderBillingDataCard.css";

interface OrderBillingDataCardProps {
  orderId: string;
  initialBillingData?: any;
  onUpdated?: (billingData: any) => void;
}

export default function OrderBillingDataCard({
  orderId,
  initialBillingData,
  onUpdated,
}: OrderBillingDataCardProps) {
  const queryClient = useQueryClient();
  const { user, sessionStatus } = useAuth();
  const { showSuccess, showError } = useAlert();

  const [activeBillingId, setActiveBillingId] = useState<string | null>(
    initialBillingData?.id || initialBillingData?.billing_data_id || null,
  );
  const [currentSnapshot, setCurrentSnapshot] = useState<any>(initialBillingData || null);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserBillingData | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [cuit, setCuit] = useState("");
  const [taxCondition, setTaxCondition] = useState<TaxCondition>("consumidor_final");
  const [companyName, setCompanyName] = useState("");

  // Fetch user billing profiles
  const { data: billingProfiles = [], isLoading } = useQuery<UserBillingData[]>({
    queryKey: ["user-billing-data", user?.id],
    queryFn: () => commerceService.getMyBillingData(),
    enabled: !!user,
  });

  // If no profile was selected yet and user has a default profile, select and attach it
  useEffect(() => {
    if (billingProfiles.length > 0 && !activeBillingId) {
      const defaultProf =
        billingProfiles.find((p) => p.is_default) || billingProfiles[0];
      if (defaultProf) {
        setActiveBillingId(defaultProf.id);
        setCurrentSnapshot(defaultProf);
        // Attach to order in background
        commerceService
          .attachOrderBillingData(orderId, defaultProf.id)
          .then((res) => {
            if (onUpdated) onUpdated(res.billing_data);
          })
          .catch((err) => console.warn("Auto-attach billing error:", err));
      }
    }
  }, [billingProfiles, activeBillingId, orderId, onUpdated]);

  // Mutation to switch active billing profile on order
  const attachMutation = useMutation({
    mutationFn: (billingId: string) =>
      commerceService.attachOrderBillingData(orderId, billingId),
    onSuccess: (res, billingId) => {
      setActiveBillingId(billingId);
      const chosen = billingProfiles.find((p) => p.id === billingId);
      if (chosen) setCurrentSnapshot(chosen);
      showSuccess("Datos de facturación vinculados a la compra.");
      if (onUpdated) onUpdated(res.billing_data);
    },
    onError: () => showError("No se pudo actualizar los datos de facturación de la orden."),
  });

  // Mutation to save (create or update) and attach immediately
  const saveAndAttachMutation = useMutation({
    mutationFn: async () => {
      const cleanCuit = cuit.replace(/\D/g, "");
      if (!fullName.trim()) {
        throw new Error("El nombre y apellido es obligatorio.");
      }
      if (!cleanCuit || cleanCuit.length < 7 || cleanCuit.length > 11) {
        throw new Error("Ingresa un CUIT/CUIL válido (entre 7 y 11 dígitos).");
      }
      if (taxCondition === "responsable_inscripto" && !companyName.trim()) {
        throw new Error("La razón social es requerida para Responsable Inscripto.");
      }

      let savedRecord: UserBillingData;

      if (editingItem) {
        const payload: UpdateUserBillingDataDto = {
          full_name: fullName.trim(),
          cuit: cleanCuit,
          tax_condition: taxCondition,
          company_name: companyName.trim() || null,
        };
        savedRecord = await commerceService.updateBillingData(editingItem.id, payload);
      } else {
        const payload: CreateUserBillingDataDto = {
          full_name: fullName.trim(),
          cuit: cleanCuit,
          tax_condition: taxCondition,
          company_name: companyName.trim() || null,
          is_default: billingProfiles.length === 0,
        };
        savedRecord = await commerceService.createBillingData(payload);
      }

      // Now attach to order
      await commerceService.attachOrderBillingData(orderId, savedRecord.id);
      return savedRecord;
    },
    onSuccess: (savedRecord) => {
      queryClient.invalidateQueries({ queryKey: ["user-billing-data"] });
      setActiveBillingId(savedRecord.id);
      setCurrentSnapshot(savedRecord);
      setIsModalOpen(false);
      showSuccess("Datos de facturación guardados y aplicados a esta compra.");
      if (onUpdated) onUpdated(savedRecord);
    },
    onError: (err: any) => {
      showError(err?.message || "No se pudo guardar los datos de facturación.");
    },
  });

  const handleOpenAdd = () => {
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: UserBillingData) => {
    setEditingItem(profile);
    setFullName(profile.full_name);
    setCuit(profile.cuit);
    setTaxCondition(profile.tax_condition);
    setCompanyName(profile.company_name || "");
    setIsModalOpen(true);
  };

  return (
    <div className="order-billing-card">
      <div className="order-billing-card__header">
        <div className="order-billing-card__title-wrap">
          <FileText size={18} className="order-billing-card__icon" />
          <h4 className="order-billing-card__title">
            Datos de Facturación para la Compra
          </h4>
        </div>
        <span className="order-billing-card__tag">Factura A o B</span>
      </div>

      <p className="order-billing-card__subtitle">
        Estos datos se envían directamente al comercio para la confección y emisión de tu comprobante fiscal.
      </p>

      {/* Profiles list or prompt */}
      {isLoading ? (
        <div className="order-billing-card__loading">
          <Loader2 size={16} className="animate-spin" />
          <span>Cargando datos fiscales...</span>
        </div>
      ) : billingProfiles.length > 0 ? (
        <div className="order-billing-card__profiles-list">
          {billingProfiles.map((prof) => {
            const isSelected = activeBillingId === prof.id;
            const isRespInscripto = prof.tax_condition === "responsable_inscripto";
            return (
              <div
                key={prof.id}
                className={`order-billing-card__item ${
                  isSelected ? "order-billing-card__item--active" : ""
                }`}
                onClick={() => {
                  if (!isSelected && !attachMutation.isPending) {
                    attachMutation.mutate(prof.id);
                  }
                }}
              >
                <div className="order-billing-card__radio">
                  {isSelected && <div className="order-billing-card__radio-dot" />}
                </div>

                <div className="order-billing-card__info">
                  <div className="order-billing-card__info-header">
                    <strong className="order-billing-card__name">
                      {prof.full_name}
                    </strong>
                    <span
                      className={`order-billing-card__badge ${
                        isRespInscripto
                          ? "order-billing-card__badge--company"
                          : "order-billing-card__badge--final"
                      }`}
                    >
                      {isRespInscripto ? "Resp. Inscripto (A)" : "Consumidor Final (B)"}
                    </span>
                  </div>

                  <div className="order-billing-card__cuit-row">
                    <span>CUIT/CUIL: <strong>{prof.cuit}</strong></span>
                    {prof.company_name && (
                      <span>• Razón Social: <strong>{prof.company_name}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="order-billing-card__edit-btn"
                  title="Modificar estos datos"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(prof);
                  }}
                >
                  <Edit2 size={14} />
                </button>
              </div>
            );
          })}

          {billingProfiles.length < 2 && (
            <button data-action-tone="add"
              type="button"
              className="order-billing-card__add-inline-btn"
              onClick={handleOpenAdd}
            >
              <Plus size={14} />
              <span>Agregar otro perfil fiscal (ej. Factura A / Empresa)</span>
            </button>
          )}
        </div>
      ) : (
        /* No saved profiles yet */
        <div className="order-billing-card__empty">
          <p>
            No tenés datos de facturación guardados. Agregalos ahora para que el vendedor te emita la factura a tu nombre o empresa.
          </p>
          <button
            type="button"
            className="btn-primary order-billing-card__btn-create"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Ingresar datos de facturación</span>
          </button>
        </div>
      )}

      {/* Confirmation feedback */}
      {currentSnapshot && (
        <div className="order-billing-card__status-bar">
          <CheckCircle2 size={14} />
          <span>
            Facturar a: <strong>{currentSnapshot.full_name}</strong> (CUIT:{" "}
            {currentSnapshot.cuit})
          </span>
        </div>
      )}

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? "Modificar Datos de Facturación"
            : "Agregar Datos de Facturación"
        }
      >
        <form
          className="order-billing-modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveAndAttachMutation.mutate();
          }}
        >
          <div className="order-billing-modal-form__field">
            <label className="order-billing-modal-form__label">
              Nombre y Apellido *
            </label>
            <input
              type="text"
              required
              className="order-billing-modal-form__input"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="order-billing-modal-form__field">
            <label className="order-billing-modal-form__label">
              CUIT / CUIL *
            </label>
            <input
              type="text"
              required
              className="order-billing-modal-form__input"
              placeholder="Ej. 20304050607 (sin guiones)"
              value={cuit}
              onChange={(e) => setCuit(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
          </div>

          <div className="order-billing-modal-form__field">
            <label className="order-billing-modal-form__label">
              Condición frente al IVA *
            </label>
            <div className="order-billing-modal-form__tabs">
              <button
                type="button"
                className={`order-billing-modal-form__tab ${
                  taxCondition === "consumidor_final"
                    ? "order-billing-modal-form__tab--active"
                    : ""
                }`}
                onClick={() => setTaxCondition("consumidor_final")}
              >
                <User size={14} />
                <span>Consumidor Final (Factura B)</span>
              </button>
              <button
                type="button"
                className={`order-billing-modal-form__tab ${
                  taxCondition === "responsable_inscripto"
                    ? "order-billing-modal-form__tab--active"
                    : ""
                }`}
                onClick={() => setTaxCondition("responsable_inscripto")}
              >
                <Building size={14} />
                <span>Responsable Inscripto (Factura A)</span>
              </button>
            </div>
          </div>

          {taxCondition === "responsable_inscripto" && (
            <div className="order-billing-modal-form__field">
              <label className="order-billing-modal-form__label">
                Razón Social / Nombre Empresa *
              </label>
              <input
                type="text"
                required
                className="order-billing-modal-form__input"
                placeholder="Ej. Comercial SA"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          )}

          <div className="order-billing-modal-form__actions">
            <button data-action-tone="cancel"
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saveAndAttachMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saveAndAttachMutation.isPending}
            >
              {saveAndAttachMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando y aplicando...</span>
                </>
              ) : (
                <span>Guardar y Aplicar a la Compra</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
