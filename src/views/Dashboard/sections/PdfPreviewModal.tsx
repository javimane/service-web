"use client";
import { useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./PdfPreviewModal.css";
import React from "react";
import { useRouter } from "next/navigation";
import { uploadProposalPdf } from "../../../services/storageUploads";
import logoImage from "../../../images/Logo solo nombre sin fondo.png";

type PdfItem = {
  qty?: number;
  name?: string;
  rate?: number;
  total?: number;
};

type PdfTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

type PdfClient = {
  name: string;
  phone: string;
  address: string;
  email: string;
};

type PdfProfessional = {
  name: string;
  email: string;
  address: string;
  companyName?: string;
  avatarUrl?: string;
};

type PdfPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  professional?: PdfProfessional;
  items?: PdfItem[];
  totals?: PdfTotals;
  client?: PdfClient;
  proposalNumber?: string;
  currencySymbol?: string;
};

export default function PdfPreviewModal({
  isOpen,
  onClose,
  professional = {
    name: "Profesional",
    email: "hola@sitioincreible.com.ar",
    address: "Calle Cualquiera 123, Cualquier Lugar",
    companyName: "",
    avatarUrl: "",
  },
  items = [],
  totals = { subtotal: 0, tax: 0, total: 0 },
  client = { name: "", phone: "", address: "", email: "" },
  proposalNumber = "01234",
  currencySymbol = "$",
}: PdfPreviewModalProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Genera el PDF y lo muestra en un objeto URL
  const generatePdf = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Top Right: Factura & Date
      doc.setFontSize(10);
      doc.setTextColor("#000000");
      doc.text("Presupuesto", pageWidth - 40, 50, { align: "right" });

      doc.setFontSize(12);
      doc.setTextColor("#ff4d4f"); // Red color for number
      doc.text(`N° ${proposalNumber}`, pageWidth - 40, 65, { align: "right" });

      // Date box
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);

      doc.setDrawColor("#000000");
      doc.rect(pageWidth - 160, 80, 120, 20); // main box
      doc.line(pageWidth - 110, 80, pageWidth - 110, 100);
      doc.line(pageWidth - 85, 80, pageWidth - 85, 100);
      doc.line(pageWidth - 60, 80, pageWidth - 60, 100);
      doc.setTextColor("#000000");
      doc.setFontSize(9);
      doc.text("FECHA", pageWidth - 155, 93);
      doc.text(day, pageWidth - 100, 93);
      doc.text(month, pageWidth - 75, 93);
      doc.text(year, pageWidth - 50, 93);

      // 2. Logo
      try {
        const img = new window.Image();
        img.src = logoImage.src;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, "PNG", 40, 40, 120, 60);
      } catch (err) {
        // Fallback if logo fails
        doc.setFontSize(24);
        doc.text("Tu logo aquí", 40, 70);
      }

      // 2b. Professional Avatar & Company
      let textX = 40;
      if (professional.avatarUrl) {
        try {
          const img = new window.Image();
          img.src = professional.avatarUrl;
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          doc.addImage(img, "JPEG", 40, 110, 40, 40);
          textX = 90;
        } catch (err) {
          console.error("Error loading professional avatar:", err);
        }
      }

      doc.setFontSize(10);
      doc.setTextColor("#000000");
      if (professional.companyName) {
        doc.setFont("helvetica", "bold");
        doc.text(professional.companyName, textX, 125);
        doc.setFont("helvetica", "normal");
        doc.text(`Prof: ${professional.name}`, textX, 140);
      } else {
        doc.setFont("helvetica", "bold");
        doc.text(professional.name, textX, 135);
      }

      // 3. Client details
      doc.setFontSize(10);
      doc.setTextColor("#000000");
      doc.setFont("helvetica", "normal");
      const startY = 180;
      doc.text(`Cliente:     ${client.name || ""}`, 40, startY);
      doc.line(80, startY + 2, 260, startY + 2); // line for client

      doc.text(`Teléfono:  ${client.phone || ""}`, 300, startY);
      doc.line(345, startY + 2, pageWidth - 40, startY + 2);

      doc.text(`Dirección: ${client.address || ""}`, 40, startY + 30);
      doc.line(90, startY + 32, 260, startY + 32);

      doc.text(`Correo:    ${client.email || ""}`, 300, startY + 30);
      doc.line(340, startY + 32, pageWidth - 40, startY + 32);

      // 4. Table
      const tableStartY = startY + 60;

      const tableBody =
        items.length > 0
          ? items.map((item: any) => [
              item.qty?.toString() || "1",
              item.name || "Servicio",
              `${currencySymbol} ${(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              `${currencySymbol} ${(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ])
          : [];

      while (tableBody.length < 12) {
        tableBody.push(["", "", "", ""]);
      }

      autoTable(doc, {
        startY: tableStartY,
        head: [["Cantidad", "Producto", "Precio", "Total"]],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineColor: [180, 180, 180],
          lineWidth: 1,
          halign: "center",
          fontStyle: "bold",
        },
        bodyStyles: {
          lineColor: [180, 180, 180],
          lineWidth: 1,
          minCellHeight: 25,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 70 },
          1: { halign: "left" },
          2: { halign: "center", cellWidth: 80 },
          3: { halign: "center", cellWidth: 80 },
        },
        margin: { left: 40, right: 40 },
      });

      // 5. Total Block
      const finalY = (doc as any).lastAutoTable.finalY + 20;

      let blockHeight = 25;
      const hasTax = totals.tax > 0;
      if (hasTax) {
        blockHeight = 65;
      }

      doc.setFillColor(255, 240, 240); // light grayish pink
      doc.rect(pageWidth - 220, finalY, 180, blockHeight, "F");
      doc.setFontSize(10);
      doc.setTextColor("#000000");

      if (hasTax) {
        doc.setFont("helvetica", "normal");
        doc.text("Subtotal", pageWidth - 210, finalY + 17);
        doc.text(`${currencySymbol} ${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 50, finalY + 17, { align: "right" });
        
        // Calculate tax percentage safely
        const taxPercent = totals.subtotal > 0 ? Math.round((totals.tax / totals.subtotal) * 1000) / 10 : 0;
        doc.text(`IVA (${taxPercent}%)`, pageWidth - 210, finalY + 34);
        doc.text(`${currencySymbol} ${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 50, finalY + 34, { align: "right" });
        
        doc.setDrawColor("#b8b8b8");
        doc.line(pageWidth - 210, finalY + 42, pageWidth - 50, finalY + 42);
        
        doc.setFont("helvetica", "bold");
        doc.text("Total", pageWidth - 210, finalY + 57);
        doc.text(`${currencySymbol} ${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 50, finalY + 57, { align: "right" });
      } else {
        doc.setFont("helvetica", "bold");
        doc.text("Total", pageWidth - 210, finalY + 17);
        doc.text(`${currencySymbol} ${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 50, finalY + 17, { align: "right" });
      }

      // 6. Footer (Red block)
      doc.setFillColor(255, 77, 79); // strong red
      doc.rect(0, pageHeight - 80, pageWidth, 80, "F");
      doc.setTextColor("#ffffff");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Icons text approximations (since images might not be loaded)
      doc.text(
        `Dirección: ${professional.address || "Sin Dirección"}`,
        40,
        pageHeight - 40,
      );
      doc.text(
        `Correo: ${professional.email || "Sin Email"}`,
        pageWidth / 2 - 50,
        pageHeight - 40,
      );

      // Preview
      const pdfBlob = doc.output("blob");
      setPdfBlob(pdfBlob);
      setPdfUrl(URL.createObjectURL(pdfBlob));
      setUploadedPdfUrl(null);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensurePdfUploaded = async () => {
    if (uploadedPdfUrl) return uploadedPdfUrl;
    if (!pdfBlob) return null;

    const uploaded = await uploadProposalPdf({
      file: pdfBlob,
      entityId: professional.name,
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
              const params = new URLSearchParams();
              params.set("prefillAttachmentName", "presupuesto.pdf");
              if (uploadedUrl) {
                params.set("prefillAttachmentUrl", uploadedUrl);
              }
              router.push(`/mensajes?${params.toString()}`);
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
