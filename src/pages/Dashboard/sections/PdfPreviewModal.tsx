import { useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import jsPDF from "jspdf";
import "./PdfPreviewModal.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import { uploadProposalPdf } from "../../../services/storageUploads";

// Cambia la ruta del logo si es necesario
const LOGO_URL = "/logo.png";

export default function PdfPreviewModal({
  isOpen,
  onClose,
  professional = { name: "Juan Pérez" },
}) {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Genera el PDF y lo muestra en un objeto URL
  const generatePdf = async () => {
    setLoading(true);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    // Logo
    try {
      const img = new window.Image();
      img.src = LOGO_URL;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      doc.addImage(img, "PNG", pageWidth - 120, 30, 80, 40);
    } catch {
      // Si falla el logo, sigue sin él
    }
    // Nombre profesional
    doc.setFontSize(16);
    doc.text(professional.name, 40, 50);
    // Título
    doc.setFontSize(28);
    doc.text("Presupuesto", pageWidth / 2, 120, { align: "center" });
    // Leyenda Sercio
    doc.setFontSize(12);
    doc.text("Presupuesto elaborado en Sercio", pageWidth / 2, 150, {
      align: "center",
    });
    // Advertencia
    doc.setFontSize(10);
    doc.setTextColor("#b91c1c");
    doc.text(
      "Los precios expresados en este presupuesto pueden variar por día, los valores expresados son informativos y no tienen carácter de factura.",
      pageWidth / 2,
      180,
      { align: "center", maxWidth: pageWidth - 80 },
    );
    doc.setTextColor("#000");
    // Aquí podrías agregar más contenido del presupuesto...
    // Preview
    const pdfBlob = doc.output("blob");
    setPdfBlob(pdfBlob);
    setPdfUrl(URL.createObjectURL(pdfBlob));
    setUploadedPdfUrl(null);
    setLoading(false);
  };

  const ensurePdfUploaded = async () => {
    if (uploadedPdfUrl) return uploadedPdfUrl;
    if (!pdfBlob) return null;

    const uploaded = await uploadProposalPdf({
      file: pdfBlob,
      entityId: professional.name,
      folder: "presupuestos",
      fileName: `presupuesto-${professional.name}.pdf`,
      contentType: "application/pdf",
    });

    setUploadedPdfUrl(uploaded.publicUrl);
    return uploaded.publicUrl;
  };

  // Descargar PDF
  const downloadPdf = async () => {
    if (!pdfUrl) return;
    try {
      await ensurePdfUploaded();
    } catch {
      // Aunque falle la subida, se mantiene la descarga local del PDF
    }

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "presupuesto.pdf";
    a.click();
  };

  // Generar PDF al abrir modal
  React.useEffect(() => {
    if (isOpen) generatePdf();
    // Limpia url previa
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista previa de presupuesto"
    >
      <div className="pdf-preview-container">
        <div className="preview-top-actions">
          <div className="preview-meta">
            <span>PRESUPUESTO.PDF</span>
            <p>Generado ahora</p>
          </div>
          <div className="preview-btns">
            <button
              className="preview-action-btn"
              disabled={loading}
              onClick={generatePdf}
            >
              <Share2 size={18} />
            </button>
            <button
              className="preview-action-btn"
              disabled={loading || !pdfUrl}
              onClick={downloadPdf}
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="preview-image-scroll">
          <div
            className="a4-page"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 600,
            }}
          >
            {loading ? (
              <span>Generando PDF...</span>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Vista previa PDF"
                width="100%"
                height="600"
                style={{ border: "none" }}
              />
            ) : (
              <span>No disponible</span>
            )}
          </div>
        </div>

        <div className="preview-footer">
          <button className="btn-close-preview" onClick={onClose}>
            Cerrar vista previa
          </button>
          <button
            className="btn-save-pdf"
            disabled={loading || !pdfUrl}
            onClick={downloadPdf}
          >
            Guardar como PDF
          </button>
          <button
            className="btn-send-pdf"
            onClick={async () => {
              let uploadedUrl = uploadedPdfUrl;
              try {
                uploadedUrl = await ensurePdfUploaded();
              } catch {
                uploadedUrl = null;
              }
              navigate("/messages", {
                state: {
                  prefillAttachmentUrl: uploadedUrl,
                  prefillAttachmentName: "presupuesto.pdf",
                },
              });
            }}
            style={{
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              marginLeft: 8,
              cursor: "pointer",
            }}
          >
            Enviar presupuesto
          </button>
        </div>
      </div>
    </Modal>
  );
}
