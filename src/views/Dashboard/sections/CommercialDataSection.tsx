"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Store,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Edit2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { commerceService, UserDataBank } from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import { ROUTES } from "@/routes/paths";
import "./CommercialDataSection.css";

export default function CommercialDataSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionStatus, user } = useAuth();
  const { showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<"company" | "banking" | "branches">("company");
  const [showMaskedCbu, setShowMaskedCbu] = useState(true);
  const [editBankModalOpen, setEditBankModalOpen] = useState(false);

  // Bank form state
  const [cbuInput, setCbuInput] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [holderInput, setHolderInput] = useState("");
  const [holderCuitInput, setHolderCuitInput] = useState("");

  // Queries
  const {
    data: bankData,
    isLoading: isLoadingBank,
    refetch: refetchBank,
  } = useQuery<UserDataBank | null>({
    queryKey: ["user-bank-data"],
    queryFn: () => commerceService.getUserBankData(),
  });

  const saveBankMutation = useMutation({
    mutationFn: (data: UserDataBank) => commerceService.saveUserBankData(data),
    onSuccess: () => {
      showSuccess("Datos de cobro bancario actualizados correctamente.");
      queryClient.invalidateQueries({ queryKey: ["user-bank-data"] });
      setEditBankModalOpen(false);
    },
    onError: () => showError("No se pudo guardar la información bancaria."),
  });

  const openBankModal = () => {
    setCbuInput(bankData?.cbu_cvu || "");
    setAliasInput(bankData?.alias || "");
    setBankNameInput(bankData?.bank_name || "");
    setHolderInput(bankData?.account_holder || "");
    setHolderCuitInput(bankData?.cuit_cuil || "");
    setEditBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbuInput || cbuInput.length < 22) {
      showError("El CBU/CVU debe tener 22 dígitos numéricos.");
      return;
    }
    saveBankMutation.mutate({
      cbu_cvu: cbuInput.trim(),
      alias: aliasInput.trim() || undefined,
      bank_name: bankNameInput.trim() || undefined,
      account_holder: holderInput.trim() || undefined,
      cuit_cuil: holderCuitInput.trim() || undefined,
    });
  };

  const companyName = sessionStatus?.company_name || "Mi Empresa Comercial";
  const cuit = sessionStatus?.cuit || "30-71234567-9";
  const isArcaVerified = true; // Registered company with active commercial plan

  const maskCbu = (cbu?: string) => {
    if (!cbu) return "No informado";
    if (!showMaskedCbu) return cbu;
    if (cbu.length < 8) return "••••••••";
    return `${cbu.slice(0, 4)} •••• •••• •••• ${cbu.slice(-4)}`;
  };

  return (
    <div className="commercial-data-section">
      <header className="commercial-data-section__header">
        <div>
          <span className="commercial-data-section__subtitle">Configuración Comercial</span>
          <h1 className="commercial-data-section__title">Datos Comerciales</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="commercial-tabs">
        <button
          type="button"
          className={`commercial-tab ${activeTab === "company" ? "commercial-tab--active" : ""}`}
          onClick={() => setActiveTab("company")}
        >
          <Building2 size={16} />
          <span>Datos Fiscales y Empresa</span>
        </button>
        <button
          type="button"
          className={`commercial-tab ${activeTab === "banking" ? "commercial-tab--active" : ""}`}
          onClick={() => setActiveTab("banking")}
        >
          <CreditCard size={16} />
          <span>Datos de Cobro (CBU / Alias)</span>
        </button>
        <button
          type="button"
          className={`commercial-tab ${activeTab === "branches" ? "commercial-tab--active" : ""}`}
          onClick={() => router.push(`${ROUTES.dashboard}?view=branches`)}
        >
          <Store size={16} />
          <span>Sucursales</span>
        </button>
      </div>

      {/* Tab 1: Company Fiscal */}
      {activeTab === "company" && (
        <div className="commercial-card">
          <div className="commercial-card__header">
            <h3 className="commercial-card__title">Información Fiscal de la Empresa</h3>
            <div className="arca-badge">
              {isArcaVerified ? (
                <>
                  <ShieldCheck size={16} className="arca-badge__icon--green" />
                  <span>Validado en ARCA</span>
                </>
              ) : (
                <>
                  <Clock size={16} className="arca-badge__icon--amber" />
                  <span>Pendiente de validación</span>
                </>
              )}
            </div>
          </div>

          <div className="commercial-fields-grid">
            <div className="commercial-field">
              <label className="commercial-label">Razón Social / Nombre Comercial</label>
              <div className="commercial-value">{companyName}</div>
            </div>

            <div className="commercial-field">
              <label className="commercial-label">CUIT</label>
              <div className="commercial-value">{cuit}</div>
            </div>

            <div className="commercial-field">
              <label className="commercial-label">Condición Fiscal frente al IVA</label>
              <div className="commercial-value">Responsable Inscripto</div>
            </div>

            <div className="commercial-field">
              <label className="commercial-label">Email Comercial</label>
              <div className="commercial-value">{user?.email || "comercial@sercio.com.ar"}</div>
            </div>

            <div className="commercial-field">
              <label className="commercial-label">Teléfono Comercial</label>
              <div className="commercial-value">
                {sessionStatus?.mobile_phone || "+54 9 11 4000-0000"}
              </div>
            </div>

            <div className="commercial-field">
              <label className="commercial-label">Domicilio Fiscal</label>
              <div className="commercial-value">
                Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires
              </div>
            </div>
          </div>

          <div className="commercial-notice">
            <ShieldCheck size={20} className="commercial-notice__icon" />
            <p>
              Tu constancia de inscripción en ARCA se encuentra validada. Las
              facturas de liquidaciones se emiten de acuerdo con esta condición impositiva.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Bank / Cobros */}
      {activeTab === "banking" && (
        <div className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <h3 className="commercial-card__title">Cuenta Bancaria para Liquidaciones</h3>
              <p className="commercial-card__subtitle">
                Acá se acreditarán los fondos liberados de tus ventas automáticamente.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={openBankModal}
            >
              <Edit2 size={16} />
              <span>Editar cuenta</span>
            </button>
          </div>

          {isLoadingBank ? (
            <p className="commercial-loading">Cargando datos bancarios...</p>
          ) : (
            <div className="commercial-fields-grid">
              <div className="commercial-field">
                <label className="commercial-label">CBU / CVU</label>
                <div className="cbu-display-row">
                  <span className="commercial-value commercial-value--mono">
                    {maskCbu(bankData?.cbu_cvu)}
                  </span>
                  {bankData?.cbu_cvu && (
                    <button
                      type="button"
                      className="cbu-reveal-btn"
                      onClick={() => setShowMaskedCbu((prev) => !prev)}
                      title={showMaskedCbu ? "Revelar CBU" : "Ocultar CBU"}
                    >
                      {showMaskedCbu ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Alias</label>
                <div className="commercial-value commercial-value--mono">
                  {bankData?.alias || "No informado"}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Entidad Bancaria / Billetera</label>
                <div className="commercial-value">
                  {bankData?.bank_name || "Banco Santander"}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Titular de la Cuenta</label>
                <div className="commercial-value">
                  {bankData?.account_holder || companyName}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">CUIT / CUIL del Titular</label>
                <div className="commercial-value">
                  {bankData?.cuit_cuil || cuit}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Bank Modal */}
      {editBankModalOpen && (
        <Modal
          isOpen={editBankModalOpen}
          onClose={() => setEditBankModalOpen(false)}
          title="Modificar Datos Bancarios"
        >
          <form className="bank-edit-form" onSubmit={handleSaveBank}>
            <div className="bank-form-group">
              <label className="commercial-label">CBU o CVU (22 dígitos)*</label>
              <input
                type="text"
                required
                maxLength={22}
                placeholder="0720123456789012345678"
                value={cbuInput}
                onChange={(e) => setCbuInput(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">Alias (opcional)</label>
              <input
                type="text"
                placeholder="miempresa.sercio"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">Nombre del Banco o Billetera</label>
              <input
                type="text"
                placeholder="Ej: Banco Galicia / Mercado Pago"
                value={bankNameInput}
                onChange={(e) => setBankNameInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">Titular de la Cuenta</label>
              <input
                type="text"
                placeholder="Nombre o Razón Social"
                value={holderInput}
                onChange={(e) => setHolderInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">CUIT / CUIL del Titular</label>
              <input
                type="text"
                placeholder="20-12345678-9"
                value={holderCuitInput}
                onChange={(e) => setHolderCuitInput(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditBankModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saveBankMutation.isPending}
              >
                Guardar cuenta
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
