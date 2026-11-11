"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import type { OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import ThermalOrderTicket from "./ThermalOrderTicket";
import { getOrderQrPayload, isPrintableOrder } from "./orderTicketData";
import { downloadThermalTicketPdf } from "./thermalTicketPdf";
import "./BatchOrderTicketsModal.css";

interface BatchOrderTicketsModalProps {
  orders: OrderSummary[];
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  branchName?: string;
  onPrinted?: (orderIds: string[]) => void;
}

export default function BatchOrderTicketsModal({ orders, isOpen, onClose, storeName = "SERCIO COMERCIO", branchName = "Sucursal Principal", onPrinted }: BatchOrderTicketsModalProps) {
  const { showSuccess, showError } = useAlert();
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printableOrders = useMemo(() => orders.filter(isPrintableOrder), [orders]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all(printableOrders.map(async (order) => [order.id, await QRCode.toDataURL(getOrderQrPayload(order), { width: 160, margin: 1 })] as const))
      .then((entries) => { if (active) setQrCodes(Object.fromEntries(entries)); })
      .catch(() => { if (active) setQrCodes({}); });
    return () => { active = false; };
  }, [isOpen, printableOrders]);

  if (!isOpen) return null;

  const markAsPrinted = () => {
    for (const order of printableOrders) {
      try { localStorage.setItem(`sercio_printed_ticket_${order.id}`, "true"); } catch { /* storage opcional */ }
    }
    onPrinted?.(printableOrders.map((order) => order.id));
  };

  const handlePrint = () => {
    if (!printableOrders.length) return;
    window.print();
    markAsPrinted();
  };

  const handleDownload = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadThermalTicketPdf(printableOrders, `tickets-${printableOrders.length}-ventas.pdf`);
      markAsPrinted();
      showSuccess("PDF de tickets generado.");
    } catch {
      showError("No se pudo generar el PDF de tickets.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Impresión de tickets">
    <div className="batch-tickets-modal">
      <div className="batch-tickets-modal__header">
        <p>{printableOrders.length} {printableOrders.length === 1 ? "venta lista" : "ventas listas"} para imprimir</p>
        <div className="batch-tickets-modal__actions">
          <button type="button" className="batch-tickets-modal__button" onClick={handleDownload} disabled={!printableOrders.length || isGeneratingPdf}><Download size={16} />{isGeneratingPdf ? "Generando..." : "Descargar PDF"}</button>
          <button type="button" className="batch-tickets-modal__button batch-tickets-modal__button--primary" onClick={handlePrint} disabled={!printableOrders.length}><Printer size={16} />Imprimir</button>
        </div>
      </div>
      {!printableOrders.length && <p>No hay ventas pagadas para imprimir.</p>}
      <div className="batch-tickets-modal__preview" id="batch-tickets-print-root">
        {printableOrders.map((order) => <ThermalOrderTicket key={order.id} order={order} qrDataUrl={qrCodes[order.id]} storeName={storeName} branchName={branchName} />)}
      </div>
    </div>
  </Modal>;
}
