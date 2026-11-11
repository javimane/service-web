"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { commerceService } from "@/services/commerceService";
import "./MerchantShipmentPickupCode.css";

export default function MerchantShipmentPickupCode({
  shipmentId,
}: {
  shipmentId: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["merchant-shipment-pickup-code", shipmentId],
    queryFn: () => commerceService.merchantPickupCode(shipmentId),
  });
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    if (!data?.seller_code) return;
    QRCode.toDataURL(`SERCIO-PICKUP:${shipmentId}:${data.seller_code}`, {
      width: 180,
      margin: 1,
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [data?.seller_code, shipmentId]);
  if (isLoading) return <p>Cargando código de retiro…</p>;
  if (isError || !data?.seller_code)
    return <p>No se pudo cargar el código de retiro.</p>;
  return (
    <div className="merchant-shipment-pickup-code">
      <p>
        Mostrale este QR o dictale el código al rider para que confirme el
        retiro e inicie el viaje.
      </p>
      {qrUrl && (
        <img
          className="merchant-shipment-pickup-code__qr"
          src={qrUrl}
          alt="QR de entrega al rider"
        />
      )}
      <strong className="merchant-shipment-pickup-code__value">
        {data.seller_code}
      </strong>
    </div>
  );
}
