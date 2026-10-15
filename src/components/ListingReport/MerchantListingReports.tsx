"use client";
import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/services/api.config";
import "./ListingReportButton.css";

type Report = { id: string; target_type: string; target_id: string; target_title?: string | null; reason: string; details: string | null; status: string; created_at: string; admin_notes?: string | null; };
const reasons: Record<string, string> = {
  counterfeit: "Posible falsificación", adulterated: "Producto adulterado", misleading: "Información engañosa",
  prohibited: "Contenido prohibido", inappropriate: "Contenido inapropiado", other: "Otro motivo",
};

export default function MerchantListingReports({ targetType }: { targetType: "professional_product" | "professional_publication" }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    apiClient.get<Report[]>(API_ENDPOINTS.listingReports.mine)
      .then(({ data }) => { if (active) setReports(data.filter(item => item.target_type === targetType)); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [targetType]);
  if (!reports.length && !error) return null;
  return <section className="listing-report__merchant">
    <h2>Denuncias recibidas {targetType === "professional_product" ? "en productos" : "en publicaciones"}</h2>
    <p>Sercio revisa cada caso antes de decidir si corresponde alguna medida.</p>
    {error ? <p role="alert">No se pudieron cargar las denuncias.</p> : reports.map(item => <article key={item.id}>
      <strong>{reasons[item.reason] || item.reason}</strong> · {item.status === "pending" ? "Pendiente" : item.status === "in_review" ? "En revisión" : item.status === "dismissed" ? "Descartada" : "Acción tomada"}
      <small> · {item.target_title || item.target_id} · {new Date(item.created_at).toLocaleDateString("es-AR")}</small>
      {item.details && <p>{item.details}</p>}
      {item.admin_notes && (
        <div className="listing-report__admin-notes">
          <strong>Mensaje de Sercio:</strong> {item.admin_notes}
        </div>
      )}
    </article>)}
  </section>;
}
