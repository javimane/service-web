"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import { Printer, Download, Phone, MapPin, Calendar, Clock, CheckCircle2, User, X } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import "./ServiceOrderVoucherModal.css";

interface ServiceOrderVoucherModalProps {
  order: OrderSummary;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
}

export default function ServiceOrderVoucherModal({
  order,
  isOpen,
  onClose,
  storeName = "SERCIO SERVICIOS",
}: ServiceOrderVoucherModalProps) {
  const { showSuccess, showError } = useAlert();

  const orderNum = order.order_number || `#SRV-${order.id.slice(0, 8).toUpperCase()}`;
  const clientName =
    order.buyer?.full_name || order.user?.full_name || "Cliente Sercio";
  const clientPhone =
    order.buyer?.phone ||
    order.buyer?.phone_number ||
    order.user?.phone ||
    order.user?.phone_number ||
    "Sin teléfono registrado";

  const address: any = order.delivery_address || order.shipping_address;

  const streetPart = address
    ? `${address.street || address.street_name || ""} ${address.number || address.street_number || ""}`.trim()
    : "Sin domicilio especificado";

  const deptoPart = address
    ? [
        address.floor ? `Piso ${address.floor}` : "",
        address.apartment_number ? `Dpto ${address.apartment_number}` : "",
        address.block ? `Mz ${address.block}` : "",
      ]
        .filter(Boolean)
        .join(" - ")
    : "";

  const betweenPart = address?.between_streets
    ? `Entre calles: ${address.between_streets}`
    : "";

  const notesPart = address?.notes
    ? `Indicaciones: ${address.notes}`
    : "";

  const cityProvincePart = address
    ? [
        address.department || address.city,
        address.province || address.state,
        address.postal_code || address.zip_code ? `CP ${address.postal_code || address.zip_code}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const serviceName = order.service?.name || "Servicio Contratado";
  const servicePrice = order.total_amount ? `$${order.total_amount.toLocaleString("es-AR")}` : "A convenir";
  const appointmentDate = order.appointment?.appointment_date || "A coordinar";
  const appointmentTime = order.appointment?.appointment_time || "A convenir";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 150],
      });

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.text("FICHA DE SERVICIO", 40, 10, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.text(storeName, 40, 15, { align: "center" });
      doc.text(`ORDEN: ${orderNum}`, 40, 20, { align: "center" });
      doc.line(5, 23, 75, 23);

      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.text("SERVICIO:", 6, 28);
      doc.setFont("courier", "normal");
      doc.text(serviceName, 6, 33, { maxWidth: 68 });
      doc.text(`Total: ${servicePrice}`, 6, 38);

      if (order.appointment?.appointment_date) {
        doc.text(`Turno: ${appointmentDate} ${appointmentTime}hs`, 6, 43);
      }

      doc.line(5, 46, 75, 46);

      doc.setFont("courier", "bold");
      doc.text("DATOS DEL CLIENTE:", 6, 51);
      doc.setFont("courier", "normal");
      doc.text(`Nombre: ${clientName}`, 6, 56);
      doc.setFont("courier", "bold");
      doc.text(`Teléfono: ${clientPhone}`, 6, 61);

      doc.line(5, 64, 75, 64);

      doc.setFont("courier", "bold");
      doc.text("DIRECCIÓN DE ATENCIÓN:", 6, 69);
      doc.setFont("courier", "normal");
      doc.text(streetPart, 6, 74, { maxWidth: 68 });

      if (deptoPart) {
        doc.text(deptoPart, 6, 79, { maxWidth: 68 });
      }

      if (betweenPart) {
        doc.text(betweenPart, 6, 84, { maxWidth: 68 });
      }

      if (cityProvincePart) {
        doc.text(cityProvincePart, 6, 89, { maxWidth: 68 });
      }

      if (notesPart) {
        doc.setFontSize(7);
        doc.text(notesPart, 6, 94, { maxWidth: 68 });
      }

      doc.line(5, 98, 75, 98);
      doc.setFontSize(7);
      doc.setFont("courier", "italic");
      doc.text("Comprobante oficial de prestación de servicio", 40, 104, {
        align: "center",
      });

      doc.save(`servicio-${order.id.slice(0, 8)}.pdf`);
      showSuccess("PDF de ficha de servicio generado.");
    } catch {
      showError("Error al generar PDF del servicio.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha y Comprobante de Servicio"
    >
      <div className="service-voucher-modal">
        <div className="service-voucher-modal__actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Imprimir Ficha</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadPdf}
          >
            <Download size={16} />
            <span>Descargar PDF</span>
          </button>
        </div>

        {/* Printable Voucher Area */}
        <div className="service-voucher-modal__preview-wrapper">
          <div id="service-voucher-print-area" className="service-voucher">
            <div className="service-voucher__header">
              <h2 className="service-voucher__title">FICHA DE SERVICIO</h2>
              <div className="service-voucher__store-name">{storeName}</div>
              <div className="service-voucher__order-id">{orderNum}</div>
            </div>

            {/* Service details */}
            <div className="service-voucher__section">
              <span className="service-voucher__section-title">DETALLE DEL SERVICIO</span>
              <div className="service-voucher__field">
                <strong>Servicio:</strong> {serviceName}
              </div>
              <div className="service-voucher__field">
                <strong>Importe:</strong> {servicePrice}
              </div>
              <div className="service-voucher__field">
                <Calendar size={14} />
                <span><strong>Turno:</strong> {appointmentDate} {appointmentTime !== "A convenir" ? `a las ${appointmentTime} hs` : ""}</span>
              </div>
            </div>

            {/* Client info with Phone prominently shown */}
            <div className="service-voucher__section service-voucher__section--highlight">
              <span className="service-voucher__section-title">DATOS DEL CLIENTE</span>
              <div className="service-voucher__field">
                <User size={14} />
                <span><strong>Nombre:</strong> {clientName}</span>
              </div>
              <div className="service-voucher__field service-voucher__field--phone">
                <Phone size={14} />
                <span><strong>Teléfono:</strong> {clientPhone}</span>
              </div>
            </div>

            {/* Full Address details */}
            <div className="service-voucher__section">
              <span className="service-voucher__section-title">DOMICILIO DE ATENCIÓN / CONTACTO</span>
              <div className="service-voucher__address-box">
                <div className="service-voucher__address-main">
                  <MapPin size={14} />
                  <strong>{streetPart}</strong>
                </div>
                {deptoPart && <div className="service-voucher__address-detail">{deptoPart}</div>}
                {betweenPart && <div className="service-voucher__address-detail">{betweenPart}</div>}
                {cityProvincePart && <div className="service-voucher__address-detail">{cityProvincePart}</div>}
                {notesPart && <div className="service-voucher__address-notes">{notesPart}</div>}
              </div>
            </div>

            <div className="service-voucher__footer">
              <p>Comprobante de coordinación y prestación de servicios</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
