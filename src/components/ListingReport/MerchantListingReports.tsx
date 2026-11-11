"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/services/api.config";
import "./ListingReportButton.css";

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  target_title?: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  admin_notes?: string | null;
};

const reasons: Record<string, string> = {
  counterfeit: "Posible falsificación",
  adulterated: "Producto adulterado",
  misleading: "Información engañosa",
  prohibited: "Contenido prohibido",
  inappropriate: "Contenido inapropiado",
  other: "Otro motivo",
};

export default function MerchantListingReports({
  targetType,
  onClose,
}: {
  targetType: "professional_product" | "professional_publication";
  onClose?: () => void;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient
      .get<Report[]>(API_ENDPOINTS.listingReports.mine)
      .then(({ data }) => {
        if (active) {
          setReports(data.filter((item) => item.target_type === targetType));
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [targetType]);

  const handleCloseAll = () => {
    setIsDismissed(true);
    onClose?.();
  };

  const handleDismissItem = (id: string) => {
    setReports((prev) => prev.filter((item) => item.id !== id));
  };

  if (isDismissed || (!reports.length && !error)) return null;

  return (
    <section className="listing-report__merchant">
      <div className="listing-report__merchant-header">
        <h2>
          Denuncias recibidas{" "}
          {targetType === "professional_product"
            ? "en productos"
            : "en publicaciones"}
        </h2>
        <button
          type="button"
          className="listing-report__merchant-close"
          onClick={handleCloseAll}
          aria-label="Cerrar denuncias"
          title="Cerrar denuncias"
        >
          <X size={18} />
        </button>
      </div>
      <p>
        Sercio revisa cada caso antes de decidir si corresponde alguna medida.
      </p>
      {error ? (
        <p role="alert">No se pudieron cargar las denuncias.</p>
      ) : (
        reports.map((item) => (
          <article key={item.id} className="listing-report__merchant-item">
            <div className="listing-report__merchant-item-top">
              <div>
                <strong>{reasons[item.reason] || item.reason}</strong> ·{" "}
                {item.status === "pending"
                  ? "Pendiente"
                  : item.status === "in_review"
                    ? "En revisión"
                    : item.status === "dismissed"
                      ? "Descartada"
                      : "Acción tomada"}
                <small>
                  {" "}
                  · {item.target_title || item.target_id} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("es-AR")}
                </small>
              </div>
              <button
                type="button"
                className="listing-report__merchant-item-close"
                onClick={() => handleDismissItem(item.id)}
                aria-label="Ocultar denuncia"
                title="Ocultar denuncia"
              >
                <X size={14} />
              </button>
            </div>
            {item.details && <p>{item.details}</p>}
            {item.admin_notes && (
              <div className="listing-report__admin-notes">
                <strong>Mensaje de Sercio:</strong> {item.admin_notes}
              </div>
            )}
          </article>
        ))
      )}
    </section>
  );
}
