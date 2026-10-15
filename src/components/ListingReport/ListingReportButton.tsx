"use client";
import { useState } from "react";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/services/api.config";
import "./ListingReportButton.css";

type TargetType = "professional_product" | "professional_publication";

export default function ListingReportButton({ targetType, targetId }: { targetType: TargetType; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!reason || busy) return;
    setBusy(true); setMessage("");
    try {
      await apiClient.post(API_ENDPOINTS.listingReports.base, {
        target_type: targetType, target_id: targetId, reason, details,
      });
      setMessage("Denuncia recibida. Sercio revisará el caso antes de tomar medidas.");
      setOpen(false);
    } catch (error: any) {
      setMessage(error?.response?.status === 401
        ? "Iniciá sesión para denunciar este contenido."
        : error?.response?.data?.message || "No se pudo enviar la denuncia.");
    } finally { setBusy(false); }
  };

  return <div className="listing-report">
    <button type="button" className="listing-report__trigger" onClick={() => setOpen(!open)}>Denunciar {targetType === "professional_product" ? "producto" : "publicación"}</button>
    {open && <div className="listing-report__form">
      <label htmlFor={`listing-report-reason-${targetId}`}>Motivo</label>
      <select id={`listing-report-reason-${targetId}`} value={reason} onChange={event => setReason(event.target.value)} required>
        <option value="">Elegí un motivo</option>
        <option value="counterfeit">Posible falsificación</option>
        <option value="adulterated">Producto adulterado</option>
        <option value="misleading">Información engañosa</option>
        <option value="prohibited">Contenido prohibido</option>
        <option value="inappropriate">Contenido inapropiado</option>
        <option value="other">Otro</option>
      </select>
      <label htmlFor={`listing-report-details-${targetId}`}>Detalle {reason === "other" ? "obligatorio" : "opcional"}</label>
      <textarea id={`listing-report-details-${targetId}`} maxLength={2000} value={details} onChange={event => setDetails(event.target.value)} />
      <button type="button" className="listing-report__submit" disabled={busy || !reason || (reason === "other" && details.trim().length < 10)} onClick={submit}>Enviar denuncia</button>
      <p>La denuncia no retira automáticamente el contenido.</p>
    </div>}
    {message && <p role="status" className="listing-report__message">{message}</p>}
  </div>;
}
