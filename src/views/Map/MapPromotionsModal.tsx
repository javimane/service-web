import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPromotionsByProfessionalAction } from "../../app/actions/professionalPromotions";
import { getBankPromotionsAction } from "../../app/actions/bankPromotions";
import "./MapPromotionsModal.css";

interface MapPromotionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number | string | null;
}

export default function MapPromotionsModal({
  isOpen,
  onClose,
  professionalId,
}: MapPromotionsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bancarias" | "normales">(
    "bancarias",
  );

  const { data: profPromotions = [], isLoading: loadingPromos } = useQuery({
    queryKey: ["professional-promotions", professionalId],
    queryFn: async () => {
      const result = await getPromotionsByProfessionalAction({
        professionalId: professionalId!.toString(),
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: isOpen && !!professionalId,
    staleTime: 1000 * 60 * 10,
  });

  const { data: bankPromotions = [], isLoading: loadingBankPromos } = useQuery({
    queryKey: ["all-bank-promotions", professionalId],
    queryFn: async () => {
      const result = await getBankPromotionsAction({
        professionalId: Number(professionalId),
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: isOpen && !!professionalId && !isNaN(Number(professionalId)),
    staleTime: 1000 * 60 * 10,
  });

  if (!isOpen) return null;

  const getBankNames = (promo: any) => {
    const relationNames = (promo.bank_promotions_banks || [])
      .map((r: any) => r.Bank?.name)
      .filter(Boolean);
    if (relationNames.length > 0) return Array.from(new Set(relationNames));
    if (promo.Bank?.name) return [promo.Bank.name];
    return ["Banco"];
  };

  const isLoading = loadingPromos || loadingBankPromos;

  return (
    <div className="map-promotions-overlay" onClick={onClose}>
      <div
        className="map-promotions-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="map-promotions-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="map-promotions-modal__title">Promociones Disponibles</h2>

        <div className="map-promotions-modal__tabs">
          <button
            className={`map-promotions-modal__tab ${activeTab === "bancarias" ? "map-promotions-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("bancarias")}
          >
            Promociones Bancarias
          </button>
          <button
            className={`map-promotions-modal__tab ${activeTab === "normales" ? "map-promotions-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("normales")}
          >
            Ofertas Especiales
          </button>
        </div>

        <div className="map-promotions-modal__content">
          {isLoading ? (
            <div className="map-promotions-modal__loading">
              Cargando promociones...
            </div>
          ) : activeTab === "bancarias" ? (
            <div className="map-promotions-modal__grid">
              {bankPromotions.map((promo: any) => {
                const bankNames = getBankNames(promo);
                return (
                  <div
                    key={promo.id}
                    className="map-promo-card map-promo-card--bank"
                    onClick={() => {
                      const path = promo.seo_path
                        ? promo.seo_path.replace(/^\/+/, "")
                        : "promo";
                      router.push(`/promociones-bancarias/${path}`);
                    }}
                  >
                    <div className="map-promo-card__header">
                      <div className="map-promo-card__banks">
                        {bankNames.map((bn: any) => (
                          <span key={bn} className="map-promo-card__badge">
                            {bn}
                          </span>
                        ))}
                      </div>
                      <span className="map-promo-card__discount">
                        {promo.percentaje_discount}%
                      </span>
                    </div>
                    <p className="map-promo-card__desc">{promo.description}</p>
                    <div className="map-promo-card__footer">
                      <span>Reintegro: ${promo.refund || "Sin tope"}</span>
                      <span className="map-promo-card__days">
                        Válido los días:{" "}
                        {[
                          promo.monday && "L",
                          promo.tuesday && "M",
                          promo.wednesday && "M",
                          promo.thursday && "J",
                          promo.friday && "V",
                          promo.saturday && "S",
                          promo.sunday && "D",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {bankPromotions.length === 0 && (
                <p className="map-promotions-modal__empty">
                  No hay promociones bancarias vigentes.
                </p>
              )}
            </div>
          ) : (
            <div className="map-promotions-modal__grid">
              {profPromotions.map((promo: any) => (
                <div
                  key={promo.id}
                  className="map-promo-card map-promo-card--normal"
                  onClick={() => {
                    if (promo.seo_path) {
                      router.push(`/promociones${promo.seo_path}`);
                    } else {
                      router.push(`/promociones/promo?id=${promo.id}`);
                    }
                  }}
                >
                  {promo.image_url && (
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="map-promo-card__img"
                    />
                  )}
                  <div className="map-promo-card__info">
                    <span className="map-promo-card__badge-normal">
                      {promo.discount_type === "percentage"
                        ? `${promo.discount_value}% OFF`
                        : `$${promo.discount_value} OFF`}
                    </span>
                    <h3 className="map-promo-card__card-title">
                      {promo.title}
                    </h3>
                    <p className="map-promo-card__desc">{promo.description}</p>
                    {promo.expires_at && (
                      <span className="map-promo-card__expires">
                        Expira:{" "}
                        {new Date(promo.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {profPromotions.length === 0 && (
                <p className="map-promotions-modal__empty">
                  No hay ofertas especiales vigentes.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
