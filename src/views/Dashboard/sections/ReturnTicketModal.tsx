"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Modal from "@/components/Modal/Modal";
import type { ReturnTicket } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import "./ReturnTicketModal.css";

type Props = { ticket: ReturnTicket; onClose: () => void };

function formatAttributes(value: unknown): string {
  if (Array.isArray(value)) return value.filter((item) => item?.name && item?.value).map((item) => `${item.name}: ${item.value}`).join(" · ");
  if (value && typeof value === "object") return Object.entries(value).map(([name, item]) => `${name}: ${item}`).join(" · ");
  return "";
}

export default function ReturnTicketModal({ ticket, onClose }: Props) {
  const { showError } = useAlert();
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const destination = ticket.destination;
  const address = [destination.street_name, destination.street_number].filter(Boolean).join(" ");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(ticket.id, { width: 240, margin: 1 })
      .then((image) => { if (active) setQr(image); })
      .catch(() => { if (active) setQr(""); });
    return () => { active = false; };
  }, [ticket.id]);

  const download = async () => {
    try {
      const element = document.getElementById(`return-ticket-${ticket.id}`);
      if (!element) return;
      setDownloading(true);
      const image = await toPng(element, { pixelRatio: 2 });
      const height = Math.max(80, element.scrollHeight * 80 / element.clientWidth);
      const pdf = new jsPDF({ unit: "mm", format: [80, height], orientation: "portrait" });
      pdf.addImage(image, "PNG", 0, 0, 80, height);
      pdf.save(`devolucion-${ticket.order_id.slice(0, 8)}.pdf`);
    } catch {
      showError("No se pudo descargar el comprobante de devolución.");
    } finally {
      setDownloading(false);
    }
  };

  return <Modal isOpen onClose={onClose} title="Comprobante de devolución">
    <div className="return-ticket-modal">
      <p className="return-ticket-modal__notice">Coordiná la entrega con el comercio antes de enviar el producto. La recepción se registrará cuando el comercio escanee el QR.</p>
      <div className="return-ticket-modal__actions">
        <button type="button" className="return-ticket-modal__button return-ticket-modal__button--primary" onClick={() => window.print()} disabled={!qr}><Printer size={16} />Imprimir</button>
        <button type="button" className="return-ticket-modal__button" onClick={download} disabled={!qr || downloading}><Download size={16} />{downloading ? "Generando..." : "Descargar PDF"}</button>
      </div>
      <div className="return-ticket-modal__preview">
        <article className="return-ticket" id={`return-ticket-${ticket.id}`}>
          <header className="return-ticket__header"><strong>SERCIO</strong><span>DEVOLUCIÓN DE PRODUCTO</span></header>
          <div className="return-ticket__code">
            {qr && <img src={qr} alt="QR de recepción de la devolución" />}
            <span>El comercio escanea este QR al recibir el producto</span>
            <strong>{ticket.id}</strong>
            <span>Solicitud: {new Date(ticket.created_at).toLocaleDateString("es-AR")}</span>
            {ticket.received_at && <span>Recibido: {new Date(ticket.received_at).toLocaleString("es-AR")}</span>}
          </div>
          <section className="return-ticket__section">
            <h3>Destinatario</h3>
            <strong>{destination.company_name}</strong>
            <span>{destination.branch_name}</span>
            <span>{address || "Dirección de la sucursal no informada"}</span>
            {destination.floor_apartment && <span>{destination.floor_apartment}</span>}
            {(destination.department || destination.province) && <span>{[destination.department, destination.province].filter(Boolean).join(", ")}</span>}
            {destination.zip_code && <span>CP {destination.zip_code}</span>}
            {destination.phone && <span>Tel: {destination.phone}</span>}
          </section>
          <section className="return-ticket__section">
            <h3>Remitente</h3>
            <strong>{ticket.buyer.name}</strong>
            {ticket.buyer.phone && <span>Tel: {ticket.buyer.phone}</span>}
            {ticket.buyer.email && <span>Email: {ticket.buyer.email}</span>}
            <span>{ticket.buyer.address || "Dirección del remitente no informada"}</span>
            {ticket.buyer.zip_code && <span>CP {ticket.buyer.zip_code}</span>}
            <span>Compra: {ticket.order_id}</span>
          </section>
          <section className="return-ticket__section">
            <h3>Contenido</h3>
            {ticket.items.map((item, index) => <div className="return-ticket__item" key={`${item.ean || item.name}-${index}`}>
              <strong>{item.quantity} × {item.name}</strong>
              {formatAttributes(item.attributes) && <span>{formatAttributes(item.attributes)}</span>}
              {item.ean && <span>EAN: {item.ean}</span>}
            </div>)}
          </section>
          <footer className="return-ticket__footer">{ticket.delivery_type === "pickup" ? "Llevá el producto a la sucursal donde lo retiraste." : "Coordiná con el comercio la entrega del producto."}<br />Si estás lejos, contactá al comercio para gestionar la devolución o garantía.<br />Este comprobante no confirma un reembolso.</footer>
        </article>
      </div>
    </div>
  </Modal>;
}
