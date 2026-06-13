"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import {
  createProfessionalPromotionAction,
  deleteProfessionalPromotionAction,
  getPromotionsByProfessionalAction,
} from "../../../app/actions/professionalPromotions";
import {
  Plus,
  Search,
  Filter,
  Ticket,
  Calendar,
  MoreVertical,
  Trash2,
  Copy,
  Loader2,
  X,
  Clock,
  Sparkles,
  Download,
  Edit2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import { formatDateDisplay } from "../../../utils/utils";
import { useRef } from "react";
import "./AllPromotionsPage.css";

const STATUS_LABELS = {
  active: "Activa",
  expired: "Expirada",
};

export default function AllPromotionsPage({ onCreateNew, onEdit }) {
  const { sessionStatus } = useAuth();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["professional-promotions", professionalId],
    queryFn: async () => {
      const result = await getPromotionsByProfessionalAction({
        professionalId,
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!professionalId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProfessionalPromotionAction({ id });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-promotions"] });
    },
    onError: (err: any) => {
      alert("Error al eliminar: " + err.message);
    },
  });

  const handleDelete = (id: string) => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar esta promoción?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (promoId: string) => {
    const promo = promosList.find((p) => p.id === promoId);
    setSelectedPromo(promo);
  };

  const handleDownloadImage = (url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `promocion-${title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCoupon = async (title: string) => {
    if (!couponRef.current) return;

    try {
      const dataUrl = await toJpeg(couponRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `cupón-${title || "promo"}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al generar imagen:", err);
      alert("No se pudo generar el archivo del cupón.");
    }
  };

  const promosList = useMemo(() => {
    return promotions.map((p) => {
      const status = p.state === "expires" ? "expired" : p.state || "active";
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        offer:
          p.discount_type === "percentage"
            ? `${p.discount_value}% OFF`
            : p.discount_type === "fixed"
              ? `$${p.discount_value}`
              : p.discount_type === "bogo"
                ? "2x1"
                : "GRATIS",
        unlimitedStock: p.unlimited_stock || false,
        applicableTo: p.applicable_to || "",
        status: status,
        validFrom: formatDateDisplay(p.from_date || ""),
        validTo: formatDateDisplay(p.expires_at || ""),
        image:
          p.image_url ||
          "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
        _original: p,
      };
    });
  }, [promotions]);

  const filtered = useMemo(() => {
    return promosList.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [promosList, search, filter]);

  const PromoSkeleton = () => (
    <div className="promo-skeleton">
      <div className="promo-skeleton__image shimmer" />
      <div className="promo-skeleton__body">
        <div className="promo-skeleton__title shimmer" />
        <div className="promo-skeleton__desc shimmer" />
        <div className="promo-skeleton__desc promo-skeleton__desc--shorter shimmer" />
        <div className="promo-skeleton__meta">
          <div className="promo-skeleton__date shimmer" />
          <div className="promo-skeleton__code shimmer" />
        </div>
      </div>
      <div className="promo-skeleton__actions">
        <div className="promo-skeleton__btn shimmer" />
        <div className="promo-skeleton__btn shimmer" />
        <div className="promo-skeleton__btn shimmer" />
      </div>
    </div>
  );

  return (
    <div className="all-promos">
      {/* Header */}
      <div className="all-promos__header">
        <div>
          <span className="all-promos__label">ADMINISTRADOR DE CAMPAÑAS</span>
          <h1 className="all-promos__title">Todas las Promociones</h1>
        </div>
        <button
          type="button"
          className="all-promos__create-btn"
          onClick={onCreateNew}
        >
          <Plus size={18} />
          Nueva Promoción
        </button>
      </div>

      {/* Filters Bar */}
      <div className="all-promos__toolbar">
        <div className="all-promos__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar promoción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="all-promos__filters">
          <Filter size={14} />
          {["all", "active", "expired"].map((f) => (
            <button
              key={f}
              type="button"
              className={`all-promos__filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="all-promos__stats">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="promo-stat-card promo-stat-card--skeleton shimmer"
              />
            ))
        ) : (
          <>
            <div className="promo-stat-card">
              <span className="promo-stat-card__value">
                {promosList.length}
              </span>
              <span className="promo-stat-card__label">Total</span>
            </div>
            <div className="promo-stat-card promo-stat-card--active">
              <span className="promo-stat-card__value">
                {promosList.filter((p) => p.status === "active").length}
              </span>
              <span className="promo-stat-card__label">Activas</span>
            </div>
            <div className="promo-stat-card promo-stat-card--expired">
              <span className="promo-stat-card__value">
                {promosList.filter((p) => p.status === "expired").length}
              </span>
              <span className="promo-stat-card__label">Expiradas</span>
            </div>
          </>
        )}
      </div>

      {/* Promotions Grid */}
      <div className="all-promos__grid">
        {isLoading
          ? Array(6)
              .fill(0)
              .map((_, i) => <PromoSkeleton key={i} />)
          : filtered.map((promo) => (
              <article
                key={promo.id}
                className="promo-list-card promo-list-card--clickable"
                onClick={() => handleView(promo.id)}
              >
                <div className="promo-list-card__image">
                  <img src={promo.image} alt={promo.title} loading="lazy" />
                  <span
                    className={`promo-list-card__status promo-list-card__status--${promo.status}`}
                  >
                    {STATUS_LABELS[promo.status]}
                  </span>
                  {promo.status === "expired" && (
                    <div className="promo-list-card__expired-overlay">
                      <span>EXPIRADA</span>
                    </div>
                  )}
                  <span className="promo-list-card__offer-badge">
                    <Ticket size={12} />
                    {promo.offer}
                  </span>
                </div>

                <div className="promo-list-card__body">
                  <h3 className="promo-list-card__title">{promo.title}</h3>
                  <p className="promo-list-card__desc">{promo.description}</p>

                  <div className="promo-list-card__meta">
                    <span className="promo-list-card__dates">
                      <Calendar size={12} />
                      {promo.validFrom} — {promo.validTo}
                    </span>
                  </div>
                </div>

                <div
                  className="promo-list-card__actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="promo-list-card__action"
                    title="Modificar"
                    onClick={() => onEdit(promo._original)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="promo-list-card__action"
                    title="Descargar Imagen"
                    onClick={() =>
                      handleDownloadImage(promo.image, promo.title)
                    }
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    className="promo-list-card__action promo-list-card__action--danger"
                    title="Eliminar"
                    onClick={() => handleDelete(promo.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables === promo.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </article>
            ))}

        {!isLoading && filtered.length === 0 && (
          <div className="all-promos__empty">
            <Ticket size={48} />
            <p>No se encontraron promociones</p>
          </div>
        )}
      </div>

      {/* View Modal (Coupon Design) */}
      {selectedPromo && (
        <div
          className="coupon-modal-overlay"
          onClick={() => setSelectedPromo(null)}
        >
          <div
            className="coupon-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="coupon-modal__close"
              onClick={() => setSelectedPromo(null)}
            >
              <X size={24} />
            </button>

            <div className="public-promo-preview" ref={couponRef}>
              <div className="public-promo-preview__hero">
                <img
                  src={selectedPromo.image}
                  alt="Promo"
                  className="public-promo-preview__image"
                />
                <div className="public-promo-preview__badge">
                  {selectedPromo.offer}
                </div>
              </div>

              <div className="public-promo-preview__content">
                <div className="public-promo-preview__header">
                  <div className="public-promo-preview__professional">
                    <div className="professional-avatar-mini">
                      <Sparkles size={16} />
                    </div>
                    <div className="professional-info">
                      <span className="professional-name">
                        {sessionStatus?.display_name || "Tu Studio"}
                      </span>
                    </div>
                  </div>
                  <h2 className="public-promo-preview__title">
                    {selectedPromo.title}
                  </h2>
                  <code className="public-promo-preview__code">
                    PROMO-{selectedPromo.id.slice(0, 8).toUpperCase()}
                  </code>
                </div>

                <p className="public-promo-preview__description">
                  {selectedPromo.description}
                </p>

                <div className="public-promo-preview__details-grid">
                  <div className="detail-item">
                    <Calendar size={18} />
                    <div className="detail-text">
                      <label>VALIDEZ</label>
                      <span>
                        {selectedPromo.validFrom} - {selectedPromo.validTo}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Sparkles size={18} />
                    <div className="detail-text">
                      <label>APLICA A</label>
                      <span>
                        {selectedPromo.applicableTo || "Todo el catálogo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="public-promo-preview__footer">
                  <button
                    className="public-promo-preview__cta"
                    onClick={() => handleDownloadCoupon(selectedPromo.title)}
                  >
                    <Ticket size={20} />
                    OBTENER ESTE CUPÓN
                  </button>
                  <p className="public-promo-preview__hint">
                    Presenta este cupón digital al momento de contratar el
                    servicio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
