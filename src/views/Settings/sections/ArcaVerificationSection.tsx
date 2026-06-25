"use client";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { arcaVerifyAction } from "../../../app/actions/companies";
import { getAccessToken } from "@/utils/auth";

type VerificationStatus = "idle" | "loading" | "success" | "error";

interface ArcaVerificationSectionProps {
  professionalId: string | number | undefined;
  companyId: number | undefined;
  arcaStatus?: any;
  loadingArca?: boolean;
}

const ArcaVerificationSection = React.memo(
  ({
    professionalId,
    companyId,
    arcaStatus,
    loadingArca,
  }: ArcaVerificationSectionProps) => {
    const queryClient = useQueryClient();
    const [cuit, setCuit] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [verificationStatus, setVerificationStatus] =
      useState<VerificationStatus>("idle");
    const [verificationMessage, setVerificationMessage] = useState("");

    const normalizedCuit = useMemo(
      () => cuit.replace(/[^\d]/g, "").slice(0, 11),
      [cuit],
    );

    const normalizedArcaStatus = useMemo(() => arcaStatus, [arcaStatus]);

    const isVerified = Boolean(
      normalizedArcaStatus?.is_verified ??
      normalizedArcaStatus?.isVerified ??
      normalizedArcaStatus?.verified ??
      normalizedArcaStatus?.CompanyArca?.[0]?.is_verified ??
      normalizedArcaStatus?.companies_arca?.[0]?.is_verified,
    );

    const handleVerifyArca = async () => {
      if (!normalizedCuit || normalizedCuit.length < 11) {
        setVerificationStatus("error");
        setVerificationMessage("Ingresá un CUIT válido de 11 dígitos.");
        return;
      }

      if (!companyName) {
        setVerificationStatus("error");
        setVerificationMessage("Ingresá la Razón Social para verificar.");
        return;
      }

      if (!professionalId) {
        setVerificationStatus("error");
        setVerificationMessage(
          "Error de sesión: No se encontró ID de profesional.",
        );
        return;
      }

      setVerificationStatus("loading");
      setVerificationMessage("Validando datos en ARCA...");

      try {
        const result = await arcaVerifyAction({
          cuit: normalizedCuit,
          companyName: companyName,
          professionalId: Number(professionalId),
          token: getAccessToken(),
        });
        if (result?.serverError) throw new Error(result.serverError);
        setVerificationStatus("success");
        setVerificationMessage(
          "¡Validación exitosa! Tu empresa ha sido verificada en ARCA.",
        );

        // Invalidate the consolidated query to refresh the status
        queryClient.invalidateQueries({ queryKey: ["professional-me"] });

        setTimeout(() => setShowForm(false), 2000);
      } catch (error: any) {
        setVerificationStatus("error");
        setVerificationMessage(
          error.message || "No se pudo validar el CUIT en ARCA.",
        );
      }
    };

    if (loadingArca) {
      return (
        <div className="arca-loading-placeholder">
          <Loader2 className="animate-spin" size={20} />
          <span>Verificando estado en ARCA...</span>
        </div>
      );
    }

    return (
      <article className="arca-container">
        {isVerified ? (
          <div className="arca-badge arca-badge--verified" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="arca-badge-content">
              <CheckCircle size={20} />
              <div className="arca-badge-text">
                <strong>Perfil Verificado en ARCA</strong>
                <span>
                  Los datos de esta empresa han sido validados oficialmente.
                </span>
              </div>
            </div>
            <button
              className="arca-toggle-form-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              {showForm ? "Cerrar" : "Volver a verificar"}
            </button>
          </div>
        ) : (
          <div className="arca-unverified-wrapper">
            <div className="arca-badge arca-badge--unverified">
              <div className="arca-badge-content">
                <AlertCircle size={20} />
                <div className="arca-badge-text">
                  <strong>Perfil No Verificado</strong>
                  <span>
                    Tu empresa aún no cuenta con la validación de datos de ARCA.
                  </span>
                </div>
              </div>
              <button
                className="arca-toggle-form-btn"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                {showForm ? "Cerrar" : "Verificar ahora"}
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="arca-form-card animate-slide-down">
                <div className="settings-fields">
                  <div className="two-columns">
                    <label className="settings-field">
                      <span>CUIT</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        placeholder="Ej: 20123456789 (solo números sin puntos ni guiones)"
                        maxLength={11}
                      />
                    </label>

                    <label className="settings-field">
                      <span>Razón Social</span>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nombre de la empresa (Tal cual figura en ARCA)"
                      />
                    </label>
                  </div>

                  <div className="arca-actions">
                    <button
                      type="button"
                      className="arca-verify-btn"
                      onClick={handleVerifyArca}
                      disabled={verificationStatus === "loading"}
                    >
                      {verificationStatus === "loading"
                        ? "Verificando..."
                        : "Verificar datos en ARCA"}
                    </button>
                  </div>

                  {verificationStatus !== "idle" && (
                    <div
                      className={`arca-verification-message arca-verification-message--${verificationStatus}`}
                      role="status"
                    >
                      {verificationMessage}
                    </div>
                  )}
                </div>
            )}
      </article>
    );
  },
);

ArcaVerificationSection.displayName = "ArcaVerificationSection";

export default ArcaVerificationSection;
