"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Bluetooth, Download, Printer } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import type { OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import ThermalOrderTicket from "./ThermalOrderTicket";
import {
  getBuyerName,
  getDeliveryAddress,
  getOrderLines,
  getOrderNumber,
  getOrderQrPayload,
  getSaleLocation,
  isPrintableOrder,
} from "./orderTicketData";
import { downloadThermalTicketPdf } from "./thermalTicketPdf";
import "./PackageThermalLabelModal.css";

interface PackageThermalLabelModalProps {
  order: OrderSummary;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  branchName?: string;
}

export default function PackageThermalLabelModal({
  order,
  isOpen,
  onClose,
  storeName = "SERCIO COMERCIO",
  branchName = "Sucursal Principal",
}: PackageThermalLabelModalProps) {
  const { showSuccess, showError } = useAlert();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!isOpen || !isPrintableOrder(order)) return;
    let active = true;
    QRCode.toDataURL(getOrderQrPayload(order), { width: 160, margin: 1 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [isOpen, order]);

  const downloadPdf = async () => {
    try {
      setIsWorking(true);
      await downloadThermalTicketPdf(
        [order],
        `etiqueta-${order.id.slice(0, 8)}.pdf`,
      );
      showSuccess("PDF de etiqueta generado.");
    } catch {
      showError("No se pudo generar el PDF de la etiqueta.");
    } finally {
      setIsWorking(false);
    }
  };

  const printBluetooth = async () => {
    const bluetooth = (
      navigator as Navigator & {
        bluetooth?: { requestDevice: (options: object) => Promise<any> };
      }
    ).bluetooth;
    if (!bluetooth) {
      showError(
        "Este navegador no admite impresión Bluetooth. Usá Chrome o Edge.",
      );
      return;
    }
    try {
      setIsWorking(true);
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb",
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
          "49535343-fe7d-4ae5-8fa9-9fafd205e455",
          0xffe0,
        ],
      });
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      let writer: any;
      for (const service of services) {
        for (const characteristic of await service.getCharacteristics()) {
          if (
            characteristic.properties.write ||
            characteristic.properties.writeWithoutResponse
          ) {
            writer = characteristic;
            break;
          }
        }
        if (writer) break;
      }
      if (!writer)
        throw new Error("No se encontró un canal de impresión ESC/POS.");
      const saleLocation = getSaleLocation(order);
      const lines = [
        "SERCIO",
        storeName,
        order.branch?.name || branchName || saleLocation.name,
        saleLocation.address,
        saleLocation.phone ? `Tel: ${saleLocation.phone}` : "",
        getOrderNumber(order),
        `Comprador: ${getBuyerName(order)}`,
        getDeliveryAddress(order),
        ...getOrderLines(order).flatMap((item) =>
          [
            `${item.quantity} x ${item.name}`,
            item.attributes,
            item.ean ? `EAN: ${item.ean}` : "",
          ].filter(Boolean),
        ),
        `Total: $${Number(order.total_amount ?? 0).toLocaleString("es-AR")}`,
      ];
      await writer.writeValue(new Uint8Array([0x1b, 0x40]));
      const bytes = new TextEncoder().encode(`${lines.filter(Boolean).join("\n")}\n\n\n`);
      for (let offset = 0; offset < bytes.length; offset += 100)
        await writer.writeValue(bytes.slice(offset, offset + 100));
      await writer.writeValue(new Uint8Array([0x1d, 0x56, 0x41, 0x10]));
      showSuccess("Ticket enviado por Bluetooth.");
    } catch (error) {
      if ((error as Error).name !== "NotFoundError")
        showError((error as Error).message || "Falló la impresión Bluetooth.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Etiqueta térmica (80 mm)">
      <div className="package-label-modal">
        {!isPrintableOrder(order) ? (
          <p>
            Esta venta no se puede imprimir mientras esté pendiente de pago o
            cancelada.
          </p>
        ) : (
          <>
            <div className="package-label-modal__toolbar">
              <button
                type="button"
                className="package-label-modal__button package-label-modal__button--primary"
                onClick={() => window.print()}
                disabled={isWorking}
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                type="button"
                className="package-label-modal__button"
                onClick={downloadPdf}
                disabled={isWorking}
              >
                <Download size={16} />
                Descargar PDF
              </button>
              <button
                type="button"
                className="package-label-modal__button"
                onClick={printBluetooth}
                disabled={isWorking}
              >
                <Bluetooth size={16} />
                Bluetooth POS
              </button>
            </div>
            <div className="package-label-modal__preview">
              <ThermalOrderTicket
                order={order}
                qrDataUrl={qrDataUrl}
                storeName={storeName}
                branchName={branchName}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
