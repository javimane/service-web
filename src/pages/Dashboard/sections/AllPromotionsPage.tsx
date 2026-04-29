import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { professionalPromotionService } from "../../../services/professionalPromotionService";
import {
  Plus,
  Search,
  Filter,
  Ticket,
  Calendar,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Loader2,
} from "lucide-react";
import "./AllPromotionsPage.css";

const STATUS_LABELS = {
  active: "Activa",
  expired: "Expirada",
  draft: "Borrador",
};

export default function AllPromotionsPage({ onCreateNew }) {
  const { sessionStatus } = useAuth();
  const professionalId = sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["professional-promotions", professionalId],
    queryFn: () => professionalPromotionService.getByProfessional(professionalId),
    enabled: !!professionalId,
  });

  const promosList = useMemo(() => {
    return promotions.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      offer: p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : 
             p.discount_type === 'fixed' ? `$${p.discount_value}` :
             p.discount_type === 'bogo' ? '2x1' : 'GRATIS',
      status: p.state || 'active',
      validFrom: p.valid_from,
      validTo: p.valid_to,
      code: p.id.slice(0, 8).toUpperCase(),
      image: p.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    }));
  }, [promotions]);

  const filtered = useMemo(() => {
    return promosList.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [promosList, search, filter]);

  return (
    <div className="all-promos">
      {/* Header */}
      <div className="all-promos__header">
        <div>
          <span className="all-promos__label">CAMPAIGN MANAGER</span>
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
          {["all", "active", "expired", "draft"].map((f) => (
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
        <div className="promo-stat-card promo-stat-card--draft">
          <span className="promo-stat-card__value">
            {promosList.filter((p) => p.status === "draft").length}
          </span>
          <span className="promo-stat-card__label">Borradores</span>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="all-promos__grid">
        {isLoading ? (
          <div className="all-promos__loading">
            <Loader2 className="animate-spin" size={32} />
            <p>Cargando promociones...</p>
          </div>
        ) : filtered.map((promo) => (
          <article key={promo.id} className="promo-list-card">
            <div className="promo-list-card__image">
              <img src={promo.image} alt={promo.title} loading="lazy" />
              <span
                className={`promo-list-card__status promo-list-card__status--${promo.status}`}
              >
                {STATUS_LABELS[promo.status]}
              </span>
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
                <code className="promo-list-card__code">{promo.code}</code>
              </div>
            </div>

            <div className="promo-list-card__actions">
              <button
                type="button"
                className="promo-list-card__action"
                title="Ver"
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                className="promo-list-card__action"
                title="Duplicar"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                className="promo-list-card__action promo-list-card__action--danger"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="all-promos__empty">
            <Ticket size={48} />
            <p>No se encontraron promociones</p>
          </div>
        )}
      </div>
    </div>
  );
}
