"use client";
import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../../routes/paths";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  User,
  Ticket,
  CheckCircle,
  MapPin,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import PromotionCard from "../../../components/Cards/PromotionCard";
import PromotionDetailModal from "../../../components/Modals/PromotionDetailModal";
import Modal from "../../../components/Modal/Modal";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./PromotionsSection.css";
import { getProfessionalPromotionsAction } from "@/app/actions/professionalPromotions";
import { getProvincesAction } from "@/app/actions/provinces";

export default function PromotionsSection({ userProvince = "Buenos Aires" }: { userProvince?: string }) {
  const router = useRouter();
  const { sessionStatus } = useAuth();
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const sliderRef = useRef(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".promotion-card");

  // Removed internal localStorage effect since HomePage handles it
  // Fetch Provinces for the selector
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Fetch Promotions based on province
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ["promotions", userProvince],
    queryFn: async () => {
      const result = await getProfessionalPromotionsAction({
        province: userProvince,
      });
      const raw = (result?.data as any) ?? result;
      // Handle both paginated { items, ... } and plain array responses
      if (raw && Array.isArray(raw.items)) return raw.items as any[];
      if (Array.isArray(raw)) return raw as any[];
      return [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // Auto-detect province handled by HomePage, or we can leave it to the user.
  const promosList = useMemo(() => {
    if (!promotionsData) return [];
    return promotionsData.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      offer:
        p.discount_type === "percentage"
          ? `${p.discount_value}% OFF`
          : p.discount_type === "fixed"
            ? `$${p.discount_value} OFF`
            : p.discount_type === "bogo"
              ? "2x1"
              : "GRATIS",
      professionalName: p.Professional?.Company?.name || "Profesional",
      validFrom: p.from_date
        ? new Date(p.from_date).toLocaleDateString()
        : "N/A",
      validTo: p.expires_at
        ? new Date(p.expires_at).toLocaleDateString()
        : "Indefinido",
      image:
        p.image_url ||
        "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
      verificationCode: `PROMO-${p.id.toString().slice(0, 4).toUpperCase()}`,
      professionalId: p.professional_id || p.Professional?.id,
      _original: p,
    }));
  }, [promotionsData]);

  const handlePromoClick = (promo) => {
    setSelectedPromo(promo);
  };

  const handleProvinceSelect = (provinceName: string) => {
    // If the user uses the internal modal, we just update localStorage and reload or let the user use the main one.
    // It's better to just redirect to the main page top or dispatch an event, but for now we'll just update localStorage and reload.
    if (typeof window !== "undefined") {
      localStorage.setItem("userProvince", provinceName);
      window.location.reload();
    }
  };

  return (
    <section className="promotions-section">
      <div className="home-section-container">
        <div className="promotions-section__header">
          <div className="promotions-section__title-group">
            <h2 className="promotions-section__title">
              Promociones Imperdibles
            </h2>
            <button
              className="promotions-section__location-btn"
              onClick={() => setIsProvinceModalOpen(true)}
            >
              <MapPin size={14} />
              {userProvince}
            </button>
          </div>
          <button
            className="section-link"
            onClick={() => router.push(ROUTES.promotions)}
          >
            Ver todo <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="promotions-section__carousel">
          {isLoading ? (
            <div className="promotions-section__loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Buscando las mejores ofertas para ti...</p>
            </div>
          ) : promosList.length === 0 ? (
            <div className="promotions-section__empty">
              <Sparkles size={48} className="empty-icon" />
              <h3>¡Vaya! No hay promos en {userProvince}</h3>
              <p>
                Intenta cambiar de provincia para descubrir más oportunidades.
              </p>
              <button
                className="change-loc-btn"
                onClick={() => setIsProvinceModalOpen(true)}
              >
                Cambiar Ubicación
              </button>
            </div>
          ) : (
            <>
              <button
                className={`carousel-control carousel-control--left ${showLeftArrow ? "" : "carousel-control--hidden"}`}
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={sliderRef}
                className="promotions-section__scroll"
                onScroll={updateArrowVisibility}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {promosList.map((promo) => (
                  <PromotionCard
                    key={promo.id}
                    promotion={promo}
                    onClick={handlePromoClick}
                  />
                ))}
              </div>

              <button
                className={`carousel-control carousel-control--right ${showRightArrow ? "" : "carousel-control--hidden"}`}
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <PromotionDetailModal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        promo={selectedPromo}
        userProvince={userProvince}
      />

      {/* Province Selector Modal */}
      <Modal
        isOpen={isProvinceModalOpen}
        onClose={() => setIsProvinceModalOpen(false)}
        title="Seleccionar Ubicación"
      >
        <div className="province-selector">
          <p className="province-selector__hint">
            Mostraremos las promociones disponibles en la provincia que elijas.
          </p>
          <div className="province-selector__grid">
            {provinces.map((prov) => (
              <button
                key={prov.id}
                className={`province-chip ${userProvince === prov.name ? "active" : ""}`}
                onClick={() => handleProvinceSelect(prov.name)}
              >
                {prov.name}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
