"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import "./BatchOrderTicketsModal.css";

interface BatchOrderTicketsModalProps {
  orders: OrderSummary[];
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  branchName?: string;
  onPrinted?: (orderIds: string[]) => void;
}

export default function BatchOrderTicketsModal({
  orders,
  isOpen,
  onClose,
  storeName = "SERCIO COMERCIO",
  branchName = "Sucursal Principal",
  onPrinted,
}: BatchOrderTicketsModalProps) {
  const { showSuccess } = useAlert();
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Generate QR codes for all orders in batch
  useEffect(() => {
    if (!isOpen || orders.length === 0) return;

    const generateQrs = async () => {
      const codeMap: Record<string, string> = {};
      for (const order of orders) {
        try {
          const payload = JSON.stringify({
            order_id: order.id,
            order_number: order.order_number || `#ORD-${order.id.slice(0, 8).toUpperCase()}`,
            delivery: order.delivery_type,
            client: order.buyer?.full_name || order.user?.full_name || "Cliente",
            branch: order.branch?.name || branchName,
          });
          const dataUrl = await QRCode.toDataURL(payload, {
            width: 140,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
          codeMap[order.id] = dataUrl;
        } catch {
          // ignore qr fail
        }
      }
      setQrCodes(codeMap);
    };

    generateQrs();
  }, [isOpen, orders, branchName]);

  if (!isOpen || orders.length === 0) return null;

  const markAllAsPrinted = () => {
    const ids: string[] = [];
    orders.forEach((o) => {
      try {
        localStorage.setItem(`sercio_printed_ticket_${o.id}`, "true");
        ids.push(o.id);
      } catch {
        // ignore storage error
      }
    });
    if (onPrinted && ids.length > 0) {
      onPrinted(ids);
    }
  };

  const handlePrintAll = () => {
    markAllAsPrinted();
    showSuccess(`Preparando impresión de ${orders.length} tickets...`);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const handleDownloadBatchPdf = () => {
    try {
      setIsGeneratingPdf(true);
      // 80mm width x 130mm height thermal label PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 130],
      });

      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage([80, 130], "portrait");
        }

        const isService = Boolean(order.service_id || order.service);
        const orderNum = order.order_number || `#ORD-${order.id.slice(0, 8).toUpperCase()}`;
        const clientName = order.buyer?.full_name || order.user?.full_name || "Cliente Sercio";
        const currentBranch = order.branch?.name || branchName;

        doc.setFont("courier", "bold");
        doc.setFontSize(13);
        doc.text(isService ? "FICHA DE SERVICIO" : "ETIQUETA DE ENVÍO", 40, 10, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        doc.text(`${storeName} - ${currentBranch}`, 40, 15, { align: "center" });
        doc.line(5, 17, 75, 17);

        const qr = qrCodes[order.id];
        if (qr) {
          doc.addImage(qr, "PNG", 27, 19, 26, 26);
        }

        doc.setFontSize(8);
        doc.setFont("courier", "bold");
        doc.text(`ID: ${orderNum}`, 40, 49, { align: "center" });

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.text(`DESTINATARIO: ${clientName}`, 6, 56);

        if (isService) {
          const srvName = order.service?.name || "Servicio Contratado";
          doc.text(`SERVICIO: ${srvName}`, 6, 62);
          if (order.appointment) {
            doc.text(`TURNO: ${order.appointment.appointment_date} ${order.appointment.appointment_time}hs`, 6, 68);
          }
        } else {
          const address: any = order.delivery_address || order.shipping_address;
          const streetPart = address
            ? `${address.street || address.street_name || ""} ${address.number || address.street_number || ""}`.trim()
            : "Retiro en local / Acordar";
          doc.text(`DIRECCIÓN: ${streetPart}`, 6, 62);
        }

        doc.line(5, 95, 75, 95);
        doc.setFont("courier", "bold");
        doc.setFontSize(9);
        doc.text(
          `TOTAL: $${Number(order.total_amount ?? 0).toLocaleString("es-AR")}`,
          40,
          102,
          { align: "center" }
        );
      });

      doc.save(`tickets_lote_${orders.length}_ordenes.pdf`);
      markAllAsPrinted();
      showSuccess("PDF de lote generado con éxito.");
    } catch {
      // ignore pdf error
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Impresión de Tickets en Lote">
      <div className="batch-tickets-modal">
        <div className="batch-tickets-modal__header">
          <div className="batch-tickets-modal__summary">
            <h4 className="batch-tickets-modal__title">
              {orders.length} {orders.length === 1 ? "comprobante seleccionado" : "comprobantes seleccionados"}
            </h4>
            <p className="batch-tickets-modal__subtitle">
              Sucursal: <strong>{branchName}</strong>. Listo para enviar a impresora térmica de 80mm o descargar.
            </p>
          </div>

          <div className="batch-tickets-modal__actions">
            <button
              type="button"
              className="batch-tickets-modal__secondary-btn"
              onClick={handleDownloadBatchPdf}
              disabled={isGeneratingPdf}
            >
              <Download size={15} />
              <span>{isGeneratingPdf ? "Generando..." : "Descargar PDF Lote"}</span>
            </button>

            <button
              type="button"
              className="batch-tickets-modal__print-btn"
              onClick={handlePrintAll}
            >
              <Printer size={16} />
              <span>Imprimir {orders.length} Tickets Ahora</span>
            </button>
          </div>
        </div>

        {/* Printable Area containing each ticket with page breaks */}
        <div className="batch-tickets-modal__preview-scroll" id="batch-tickets-print-root">
          {orders.map((order, idx) => {
            const isService = Boolean(order.service_id || order.service);
            const orderNum = order.order_number || `#ORD-${order.id.slice(0, 8).toUpperCase()}`;
            const clientName = order.buyer?.full_name || order.user?.full_name || "Cliente Sercio";
            const clientPhone =
              order.buyer?.phone ||
              order.buyer?.phone_number ||
              order.user?.phone ||
              order.user?.phone_number ||
              "Sin teléfono";
            const address: any = order.delivery_address || order.shipping_address;
            const streetPart = address
              ? `${address.street || address.street_name || ""} ${address.number || address.street_number || ""}`.trim()
              : "Retiro en sucursal / Acordar con vendedor";

            const article =
              order.professional_product?.product?.name ||
              order.service?.name ||
              (order.items && order.items[0]?.product_name) ||
              (isService ? "Servicio" : "Producto");

            const currentBranch = order.branch?.name || branchName;

            return (
              <div key={order.id} className="batch-ticket-container">
                <div className="batch-ticket-container__type-badge">
                  {idx + 1}/{orders.length} — {isService ? "Ficha de Servicio" : "Etiqueta Térmica"}
                </div>

                <div className="batch-ticket-container__header">
                  <h3 className="batch-ticket-container__title">
                    {isService ? "SERCIO SERVICIOS" : "SERCIO ENVÍOS"}
                  </h3>
                  <div className="batch-ticket-container__store">
                    {storeName} — {currentBranch}
                  </div>
                  <div className="batch-ticket-container__order-number">
                    {orderNum}
                  </div>
                </div>

                {qrCodes[order.id] && (
                  <div style={{ textAlign: "center", margin: "2mm 0" }}>
                    <img
                      src={qrCodes[order.id]}
                      alt={orderNum}
                      style={{ width: "28mm", height: "28mm" }}
                    />
                  </div>
                )}

                <div className="batch-ticket-container__body">
                  <div className="batch-ticket-container__row">
                    <span className="batch-ticket-container__label">Cliente:</span>
                    <span className="batch-ticket-container__val batch-ticket-container__val--highlight">
                      {clientName}
                    </span>
                    {clientPhone !== "Sin teléfono" && (
                      <span className="batch-ticket-container__val">Tel: {clientPhone}</span>
                    )}
                  </div>

                  {isService ? (
                    <>
                      <div className="batch-ticket-container__row">
                        <span className="batch-ticket-container__label">Servicio:</span>
                        <span className="batch-ticket-container__val">{article}</span>
                      </div>
                      {order.appointment && (
                        <div className="batch-ticket-container__row">
                          <span className="batch-ticket-container__label">Turno Programado:</span>
                          <span className="batch-ticket-container__val batch-ticket-container__val--highlight">
                            {order.appointment.appointment_date} a las {order.appointment.appointment_time} hs
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="batch-ticket-container__row">
                        <span className="batch-ticket-container__label">Destino / Entrega:</span>
                        <span className="batch-ticket-container__val">{streetPart}</span>
                      </div>
                      <div className="batch-ticket-container__row">
                        <span className="batch-ticket-container__label">Artículo:</span>
                        <span className="batch-ticket-container__val">
                          {article} (Cant: {order.quantity || 1})
                        </span>
                      </div>
                    </>
                  )}

                  <div className="batch-ticket-container__total-row">
                    <span>TOTAL:</span>
                    <span>${Number(order.total_amount ?? 0).toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <div className="batch-ticket-container__footer">
                  <span>Generado por Sercio — {new Date().toLocaleDateString("es-AR")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
