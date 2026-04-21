import { type ChangeEvent, useMemo, useState } from "react";
import { uploadProposalPdf } from "../../../services/storageUploads";

type VerificationStatus = "idle" | "loading" | "success" | "error";

export default function ArcaVerificationSection() {
  const [cuit, setCuit] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const arcaVerifyEndpoint = import.meta.env.VITE_ARCA_VERIFY_ENDPOINT;

  const normalizedCuit = useMemo(
    () => cuit.replace(/[^\d]/g, "").slice(0, 11),
    [cuit],
  );

  const handleVerifyArca = async () => {
    if (!normalizedCuit) {
      setVerificationStatus("error");
      setVerificationMessage("Ingresá un CUIT para verificar.");
      return;
    }

    if (!arcaVerifyEndpoint) {
      setVerificationStatus("error");
      setVerificationMessage(
        "No se configuró el endpoint de verificación ARCA.",
      );
      return;
    }

    setVerificationStatus("loading");
    setVerificationMessage("Validando datos en ARCA...");

    try {
      const response = await fetch(arcaVerifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cuit: normalizedCuit }),
      });

      if (response.status === 200) {
        setVerificationStatus("success");
        setVerificationMessage("Validación exitosa en ARCA.");
        return;
      }

      setVerificationStatus("error");
      setVerificationMessage("No se pudo validar el CUIT en ARCA.");
    } catch {
      setVerificationStatus("error");
      setVerificationMessage("No se pudo validar el CUIT en ARCA.");
    }
  };

  const handleArcaPdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadMessage("Subiendo constancia...");
      const uploaded = await uploadProposalPdf({
        file,
        entityId: normalizedCuit || "sin-cuit",
        folder: "arca-constancias",
        fileName: file.name,
        contentType: "application/pdf",
      });
      setUploadMessage(`Archivo subido correctamente: ${uploaded.publicUrl}`);
    } catch {
      setUploadMessage("No se pudo subir la constancia.");
    }
  };

  return (
    <article className="settings-card settings-card--wide verification-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🧾</span>
          <h2>ARCA Verification</h2>
        </div>
      </div>

      <div className="settings-fields">
        <label className="settings-field settings-field--full">
          <span>CUIT</span>
          <div className="arca-verification-row">
            <input
              type="text"
              inputMode="numeric"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="Ej: 20-12345678-9"
              maxLength={13}
            />
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
        </label>

        {verificationStatus !== "idle" && (
          <div
            className={`arca-verification-message arca-verification-message--${verificationStatus}`}
            role="status"
          >
            {verificationMessage}
          </div>
        )}

        <span className="upload-label">
          Constancia de inscripción de AFIP en formato PDF
        </span>
        <label className="upload-box">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleArcaPdfUpload}
          />
          <span className="upload-icon">📎</span>
          <strong>UPLOAD DOCUMENT</strong>
          <small>PDF, JPG o PNG hasta 5MB</small>
        </label>
        {uploadMessage ? <small>{uploadMessage}</small> : null}
      </div>
    </article>
  );
}
