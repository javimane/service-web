import { useState } from "react";
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
} from "lucide-react";
import "./AllPromotionsPage.css";

const MOCK_PROMOTIONS = [
  {
    id: "a1b2c3d4",
    title: "Gran Inauguración",
    description: "Descuento especial en todos los servicios de plomería.",
    offer: "30% OFF",
    type: "DISCOUNT",
    status: "active",
    validFrom: "2026-04-15",
    validTo: "2026-05-15",
    code: "A1B2C3D4",
    image:
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "e5f6g7h8",
    title: "Combo Limpieza",
    description:
      "Contrata limpieza de hogar y llévate la de oficina a mitad de precio.",
    offer: "2x1",
    type: "BOGO",
    status: "active",
    validFrom: "2026-04-10",
    validTo: "2026-04-30",
    code: "E5F6G7H8",
    image:
      "https://images.unsplash.com/photo-1581578731522-bc0edec9057b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "i9j0k1l2",
    title: "Mes de la Electricidad",
    description: "Revisión de tablero eléctrico sin cargo.",
    offer: "GRATIS",
    type: "FREE",
    status: "expired",
    validFrom: "2026-03-01",
    validTo: "2026-03-31",
    code: "I9J0K1L2",
    image:
      "https://images.unsplash.com/photo-1621905252507-b354bc2d1d6c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "m3n4o5p6",
    title: "Promoción Pintura",
    description: "Pinta 3 ambientes y el 4to es sin cargo de mano de obra.",
    offer: "3x2",
    type: "MULTIBUY",
    status: "draft",
    validFrom: "2026-05-01",
    validTo: "2026-06-01",
    code: "M3N4O5P6",
    image:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  },
];

const STATUS_LABELS = {
  active: "Activa",
  expired: "Expirada",
  draft: "Borrador",
};

export default function AllPromotionsPage({ onCreateNew }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_PROMOTIONS.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

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
            {MOCK_PROMOTIONS.length}
          </span>
          <span className="promo-stat-card__label">Total</span>
        </div>
        <div className="promo-stat-card promo-stat-card--active">
          <span className="promo-stat-card__value">
            {MOCK_PROMOTIONS.filter((p) => p.status === "active").length}
          </span>
          <span className="promo-stat-card__label">Activas</span>
        </div>
        <div className="promo-stat-card promo-stat-card--expired">
          <span className="promo-stat-card__value">
            {MOCK_PROMOTIONS.filter((p) => p.status === "expired").length}
          </span>
          <span className="promo-stat-card__label">Expiradas</span>
        </div>
        <div className="promo-stat-card promo-stat-card--draft">
          <span className="promo-stat-card__value">
            {MOCK_PROMOTIONS.filter((p) => p.status === "draft").length}
          </span>
          <span className="promo-stat-card__label">Borradores</span>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="all-promos__grid">
        {filtered.map((promo) => (
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
