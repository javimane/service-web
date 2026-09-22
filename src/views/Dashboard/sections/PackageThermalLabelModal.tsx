"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Printer, Download, Bluetooth, CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isBluetoothSupported, setIsBluetoothSupported] = useState<boolean>(false);
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);
  const [btStatus, setBtStatus] = useState<string>("");

  const orderNum = order.order_number || `#ORD-${order.id.slice(0, 8).toUpperCase()}`;
  const clientName =
    order.buyer?.full_name || order.user?.full_name || "Cliente Sercio";

  const address: any = order.delivery_address || order.shipping_address;
  const streetPart = address
    ? `${address.street || address.street_name || ""} ${address.number || address.street_number || ""}`.trim()
    : "Retiro en local / Acordar con vendedor";

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
    ? `Entre: ${address.between_streets}`
    : "";

  const notesPart = address?.notes
    ? `Nota: ${address.notes}`
    : "";

  const cityProvincePart = address
    ? [
        address.department || address.city,
        address.province || address.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const zipCode = address?.postal_code || address?.zip_code
    ? `CP ${address.postal_code || address.zip_code}`
    : "";

  const addressLine = [streetPart, deptoPart, betweenPart, cityProvincePart, zipCode]
    .filter(Boolean)
    .join(" - ");

  const isDeliveryByCompany =
    order.delivery_type === "coordinate_with_merchant" ||
    order.delivery_type === "pickup";
  const deliveryTypeLabel =
    order.delivery_type === "pickup"
      ? "RETIRO EN TIENDA"
      : order.delivery_type === "shipment"
      ? "RIDER SERCIO (LOGÍSTICA)"
      : "ENVÍO PROPIO (EMPRESA)";

  useEffect(() => {
    if (typeof window !== "undefined" && "bluetooth" in navigator) {
      setIsBluetoothSupported(true);
    }

    const payload = JSON.stringify({
      order_id: order.id,
      order_number: orderNum,
      security_code: order.pickup_code || "",
      client: clientName,
    });

    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR for label:", err));
  }, [order, orderNum, clientName]);

  const handleBrowserPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    try {
      // 80mm width x 130mm height thermal label PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 130],
      });

      doc.setFont("courier", "bold");
      doc.setFontSize(14);
      doc.text("SERCIO ENVÍOS", 40, 10, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.text(`${storeName} - ${branchName}`, 40, 15, { align: "center" });
      doc.line(5, 17, 75, 17);

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", 25, 19, 30, 30);
      }
      doc.setFontSize(8);
      doc.setFont("courier", "bold");
      doc.text(`ID: ${orderNum}`, 40, 52, { align: "center" });
      doc.line(5, 54, 75, 54);

      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      doc.text("DESTINATARIO:", 6, 59);
      doc.setFont("courier", "normal");
      doc.text(clientName, 6, 64);
      doc.text(streetPart, 6, 69);
      if (deptoPart || betweenPart) {
        doc.setFontSize(8);
        doc.text([deptoPart, betweenPart].filter(Boolean).join(" | "), 6, 73, { maxWidth: 68 });
      }
      doc.setFontSize(8);
      doc.text(`${cityProvincePart} ${zipCode}`.trim(), 6, 78, { maxWidth: 68 });
      if (notesPart) {
        doc.setFontSize(7);
        doc.text(notesPart, 6, 82, { maxWidth: 68 });
      }
      doc.line(5, 85, 75, 85);

      doc.setFont("courier", "bold");
      doc.text(`TIPO: ${deliveryTypeLabel}`, 6, 89);
      if (order.pickup_code) {
        doc.text(`CÓDIGO DE RETIRO: ${order.pickup_code}`, 6, 95);
      }

      doc.line(5, 98, 75, 98);
      doc.setFontSize(7);
      doc.setFont("courier", "italic");
      doc.text("Escanear este código para entrega y retiro", 40, 104, {
        align: "center",
      });

      doc.save(`etiqueta-${order.id.slice(0, 8)}.pdf`);
      showSuccess("PDF de etiqueta generado.");
    } catch (err: any) {
      showError("Error al generar PDF de etiqueta.");
    }
  };

  const handleBluetoothPrint = async () => {
    if (!isBluetoothSupported) {
      showError(
        "Tu navegador actual no admite Web Bluetooth (usa Google Chrome o Microsoft Edge)."
      );
      return;
    }

    try {
      setIsConnectingBt(true);
      setBtStatus("Buscando impresora Bluetooth cercana...");

      const nav: any = navigator;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb",
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
          "49535343-fe7d-4ae5-8fa9-9fafd205e455",
          0xffe0,
          0x18f0,
        ],
      });

      setBtStatus(`Conectando con ${device.name || "impresora"}...`);
      const server = await device.gatt.connect();

      // Find primary service and writable characteristic
      const services = await server.getPrimaryServices();
      let writeChar: any = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      }

      if (!writeChar) {
        throw new Error("No se encontró canal de escritura ESC/POS en el dispositivo.");
      }

      // Encode ESC/POS Bytes
      const encoder = new TextEncoder();
      const escInit = new Uint8Array([0x1b, 0x40]); // Init
      const escCenter = new Uint8Array([0x1b, 0x61, 0x01]); // Align center
      const escLeft = new Uint8Array([0x1b, 0x61, 0x00]); // Align left
      const escBoldOn = new Uint8Array([0x1b, 0x45, 0x01]);
      const escBoldOff = new Uint8Array([0x1b, 0x45, 0x00]);
      const escFeedCut = new Uint8Array([0x1d, 0x56, 0x41, 0x10]); // Feed & Cut

      const textPayload =
        `\n--- SERCIO ENVIOS ---\n` +
        `${storeName}\n` +
        `--------------------------------\n` +
        `PEDIDO: ${orderNum}\n` +
        `DESTINATARIO: ${clientName}\n` +
        `DIRECCION: ${streetPart}\n` +
        (deptoPart ? `DEPTO/PISO: ${deptoPart}\n` : "") +
        (betweenPart ? `${betweenPart}\n` : "") +
        (cityProvincePart ? `LOCALIDAD: ${cityProvincePart} ${zipCode}\n` : "") +
        (notesPart ? `${notesPart}\n` : "") +
        `ENVIO: ${deliveryTypeLabel}\n` +
        (order.pickup_code ? `CODIGO RETIRO: ${order.pickup_code}\n` : "") +
        `--------------------------------\n\n\n`;

      await writeChar.writeValue(escInit);
      await writeChar.writeValue(escCenter);
      await writeChar.writeValue(escBoldOn);
      await writeChar.writeValue(encoder.encode(textPayload));
      await writeChar.writeValue(escFeedCut);

      showSuccess("¡Etiqueta enviada a la impresora térmica Bluetooth!");
      setBtStatus("Impresión Bluetooth completada.");
    } catch (err: any) {
      console.warn("Bluetooth print warning:", err);
      if (err.name !== "NotFoundError") {
        showError(err.message || "Error al conectar con la impresora Bluetooth.");
      }
      setBtStatus("");
    } finally {
      setIsConnectingBt(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Etiqueta Térmica de Paquete (80mm)"
    >
      <div className="package-label-modal">
        <p className="package-label-modal__intro">
          Pegá esta etiqueta autoadhesiva en la bolsa o caja del pedido. Cuenta con
          código QR para escaneo por parte del repartidor o comercio en el retiro.
        </p>

        <div className="package-label-modal__toolbar">
          <button
            type="button"
            className="btn-primary"
            onClick={handleBrowserPrint}
          >
            <Printer size={16} />
            <span>Imprimir Etiqueta</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadPdf}
          >
            <Download size={16} />
            <span>Descargar PDF</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={isConnectingBt}
            onClick={handleBluetoothPrint}
            title={
              isBluetoothSupported
                ? "Imprimir directo vía Bluetooth ESC/POS"
                : "Bluetooth disponible en Google Chrome / Edge"
            }
          >
            <Bluetooth size={16} />
            <span>
              {isConnectingBt
                ? "Conectando..."
                : "Imprimir Bluetooth POS"}
            </span>
          </button>

          {btStatus && (
            <span className="package-label-modal__bluetooth-status">
              <CheckCircle2 size={14} /> {btStatus}
            </span>
          )}
        </div>

        {/* Thermal Sticker Visual Preview */}
        <div className="package-label-modal__preview-wrapper">
          <div id="thermal-sticker-print-area" className="thermal-sticker">
            <div className="thermal-sticker__header">
              <h2 className="thermal-sticker__logo-title">SERCIO</h2>
              <div className="thermal-sticker__subtitle">
                LOGÍSTICA Y ENTREGAS
              </div>
              <div className="thermal-sticker__store-name">
                {storeName} - {branchName}
              </div>
            </div>

            {/* QR Code */}
            <div className="thermal-sticker__qr-section">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Paquete"
                  className="thermal-sticker__qr-image"
                />
              ) : (
                <div style={{ width: 120, height: 120, background: "#eee" }} />
              )}
              <div className="thermal-sticker__scan-code">{orderNum}</div>
            </div>

            {/* Recipient info (Phone omitted for privacy/courier rule) */}
            <div className="thermal-sticker__section">
              <span className="thermal-sticker__section-title">DESTINATARIO</span>
              <div className="thermal-sticker__field">
                <strong>Nombre:</strong> {clientName}
              </div>
              <div className="thermal-sticker__address-box">
                <div>📍 <strong>{streetPart}</strong></div>
                {deptoPart && <div>{deptoPart}</div>}
                {betweenPart && <div>{betweenPart}</div>}
                {cityProvincePart && <div>{cityProvincePart} {zipCode}</div>}
                {notesPart && <div className="thermal-sticker__note-text">{notesPart}</div>}
              </div>
            </div>

            {/* Delivery type and details */}
            <div className="thermal-sticker__section">
              <div className="thermal-sticker__field">
                <strong>Tipo de Envío:</strong> {deliveryTypeLabel}
              </div>
              {order.pickup_code && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: "bold" }}>
                    CÓDIGO DE RETIRO / SEGURIDAD:
                  </div>
                  <div className="thermal-sticker__security-code">
                    {order.pickup_code}
                  </div>
                </div>
              )}
            </div>

            {/* Order items summary */}
            <div className="thermal-sticker__section">
              <div className="thermal-sticker__field">
                <strong>Contenido del Paquete:</strong>
              </div>
              <table className="thermal-sticker__items-table">
                <thead>
                  <tr>
                    <th>Cant.</th>
                    <th>Artículo</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ width: 30 }}>{item.quantity}x</td>
                        <td>{item.product_name || "Producto"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>1x</td>
                      <td>
                        {order.professional_product?.product?.name ||
                          order.service?.name ||
                          "Artículo de pedido"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="thermal-sticker__footer">
              Escanear código QR para confirmar recepción o retiro.
              <br />
              soporte@sercio.com.ar - sercio.com.ar
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
